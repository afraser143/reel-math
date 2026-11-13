# 🎣 Reel Math

**Multiplication facts practice for kids who'd rather be bass fishing.**

I built this for my 9-year-old, who loves fishing and didn't love times-table flashcards. Every correct answer lands a bass, and faster answers land bigger fish. Each times table is a lake that unlocks as he learns the one before it. Behind the game, a spaced-repetition engine decides which facts to show, and Claude writes fishing word problems aimed at the facts he finds hardest.

| Cast a line | Fish on! | The line snapped |
|---|---|---|
| ![Question screen](docs/screenshots/question.png) | ![A catch](docs/screenshots/catch.png) | ![A miss with a strategy tip](docs/screenshots/missed.png) |

| Lake map | Parent progress report | Phone, dark mode |
|---|---|---|
| ![Lake map](docs/screenshots/lake-map.png) | ![Progress report](docs/screenshots/progress.png) | ![Phone in dark mode](docs/screenshots/phone-dark.png) |

## Features

- **Spaced repetition (Leitner boxes).** Each fact moves through boxes 0–5. A correct answer in under 6 seconds moves it up a box, and higher boxes come back less often (10 minutes, then 1, 3, 7 and 14 days). A miss drops the fact to box 1 and brings it back within a minute, and missed facts get a second try at the end of the trip.
- **Fishing rewards that measure fluency.** A bite meter drains while he thinks. Answer speed sets the fish's weight, and rare species (Guadalupe bass, redeye bass) only bite on quick answers to facts he already knows.
- **Lakes unlock in teaching order:** 2s, 5s and 10s first; 7s, 8s and 12s last. A lake opens once 9 of the 12 facts in the lake before it are in box 2 or higher.
- **Guide tips on misses.** Each missed fact gets a strategy using the easier factor ("Times 9: do 7 × 10 = 70, then take away one 7"), not just the answer.
- **AI tournament challenges.** Claude writes short fishing story problems for the facts he struggles with most. See [AI design](#ai-design) for how a bad generation is kept from teaching a wrong fact.
- **Parent progress report** showing a heatmap of all 132 facts and the ones missed most often.
- **Works on tablets, phones and laptops.** A big on-screen number pad plus keyboard input, dark mode, and reduced motion when the device asks for it.

## Stack

| | |
|---|---|
| App | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Data | PostgreSQL via Drizzle ORM. Falls back to embedded [PGlite](https://pglite.dev) (Postgres in WASM) when `DATABASE_URL` is unset |
| Auth | Email + password (argon2id), random session tokens stored as SHA-256 hashes, httpOnly cookies |
| AI | Claude via the Anthropic TypeScript SDK, structured outputs with a Zod schema |
| Tests | Vitest, with each test running against a fresh in-memory Postgres |
| CI | GitHub Actions: lint, typecheck, tests, build, and migrations against a real Postgres service |

## Architecture

```
src/
  lib/domain/      Pure game logic, no I/O: spaced repetition, lakes, fish, hints, word-problem validation
  lib/server/      Services that take a Db handle: auth, fishing trips, answers, AI generation
  app/api/         Thin route handlers: auth → validate with Zod → call a service
  app/anglers/     Server-rendered pages (lake map, livewell, progress) + client game screens
  db/              Drizzle schema, connection (Postgres or PGlite), migrations in /drizzle
```

The **domain layer** is pure functions with an injectable RNG, so the spaced repetition, unlock rules and fish generation are tested deterministically. The **service layer** takes a `Db` instead of importing a global, so integration tests each get an isolated in-memory Postgres in milliseconds. No Docker is needed to run the test suite.

### Design decisions

- **The server grades every answer.** The client sends the answer it typed, never "I got it right", so the client can't fake a catch. Answering in a locked lake, or sending a made-up fact, is rejected.
- **Each answer is one transaction.** The fact's progress row is locked (`SELECT … FOR UPDATE`), updated with an upsert, the catch is inserted, and lake unlocks are worked out from the state before and after the answer. Two quick taps can't race each other.
- **Kids have no credentials.** A parent account owns up to 6 profiles, each just a nickname and an emoji badge. Every profile route checks ownership and returns 404, not 403, for another parent's profile, so it doesn't reveal that the profile exists.
- **Session tokens are hashed at rest.** A database leak doesn't expose usable session cookies. Login does a dummy argon2 verify when the email doesn't exist, so response timing doesn't reveal which emails have accounts.
- **POST routes require a JSON content type.** Combined with `SameSite=Lax` cookies, this blocks cross-site form posts (CSRF) without a separate token.
- **Zero-setup local dev.** Without `DATABASE_URL` the app uses PGlite, which stores data in `./.pglite`. It's the same SQL dialect and the same migrations as production Postgres.

### AI design

Generated word problems go to a child who is still learning, so the model's output is treated as untrusted:

1. **No personal data in the prompt.** The model receives only the facts, such as `7 × 8`, never his nickname or anything else about him. A test checks this.
2. **Structured output.** Responses are constrained to a Zod schema (`{a, b, story, answer}`) with `messages.parse`.
3. **Every problem is checked by code** (`validateProblem`): the numbers must match the target fact, the answer must equal `a × b`, both numbers must appear in the story as whole numbers (so 18 doesn't count as 8), the story can't contain the answer, and it must end in a question and stay short.
4. **Any problem that fails is replaced** by a built-in template for that fact, so a set always has 5 valid problems.
5. **It still works without AI.** With no API key, the API down, a refusal or a timeout, the tournament still runs on templates.
6. **Cost controls:** a per-parent daily limit (an atomic Postgres upsert counter, `AI_DAILY_LIMIT`, default 30), low effort for a simple writing task, and one retry at most so a child isn't left waiting.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000, embedded database, no setup
```

Optional configuration (see [`.env.example`](.env.example)):

```bash
ANTHROPIC_API_KEY=...                                        # enables AI word problems
DATABASE_URL=postgres://reelmath:reelmath@localhost:5432/reelmath  # use real Postgres
```

To use real Postgres locally, run `docker compose up -d` and set `DATABASE_URL` as above. Migrations run automatically on the first request, or with `npm run db:migrate`.

```bash
npm test             # 32 unit + integration tests
npm run typecheck
npm run lint
```

### Deploying

Any Node host works with a managed Postgres (Neon, Supabase, Render, Fly). Set `DATABASE_URL` and, optionally, `ANTHROPIC_API_KEY`, then run `npm run db:migrate` during the deploy. PGlite is for local development only, because serverless filesystems don't persist.

## Ideas for later

- Weekly email digest for parents
- Seasonal tournaments with a family leaderboard
- Division facts as "catch and release"

## License

MIT
