import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Shell } from "@/components/ui";

export const metadata = {
  title: "Privacy · Reel Math",
  description: "What Reel Math stores, why, and how to delete it.",
};

const UPDATED = "November 13, 2026";
const REPO = "https://github.com/afraser143/reel-math";

export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL;

  return (
    <Shell title="Privacy" back={{ href: "/", label: "Home" }}>
      <Card className="bg-reed-soft">
        <h2 className="text-lg font-black">The short version</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>A parent creates the account. Kids never enter an email, a password, or their real name.</li>
          <li>We store the parent&apos;s email and what each kid practices: which facts, right or wrong, and how fast.</li>
          <li>No ads, no analytics, no tracking cookies. Nothing is sold or shared for marketing.</li>
          <li>Nothing about your kids is sent to the AI. It only sees multiplication facts like &ldquo;7 × 8&rdquo;.</li>
          <li>You can delete an angler or your whole account at any time, and it&apos;s gone for good.</li>
        </ul>
      </Card>

      <div className="mt-8 space-y-8 leading-relaxed">
        <Section title="Who runs Reel Math">
          <p>
            Reel Math is a free, non-commercial project made by a parent for their own kid and shared with friends and
            classmates. It isn&apos;t a company product. The code is open source on{" "}
            <A href={REPO}>GitHub</A>, so anyone can check that this page matches what the app does.
          </p>
        </Section>

        <Section title="What we store">
          <Table
            rows={[
              ["Parent email", "To sign in. Never used for marketing, and no email is sent from Reel Math."],
              ["Password", "Stored only as a one-way hash (argon2id). Nobody, including us, can read it."],
              ["Angler nickname and badge", "Shown on screen so each kid can pick their profile. Please use a fun name, not a full real name."],
              [
                "Practice history",
                "For each fact: how many times it was answered right and wrong, when it was last practised, and its learning level. This is what decides which facts come up next.",
              ],
              ["Catches", "Each fish caught: species, weight, the fact that was answered, and how long the answer took."],
              ["Sign-in session", "A random token in one cookie that keeps you signed in for up to 30 days. We store only a hash of it."],
              ["AI usage count", "How many tournament challenges an account requested each day, to keep costs within a daily limit."],
            ]}
          />
          <p className="mt-3">
            We don&apos;t collect kids&apos; real names, ages, birthdays, schools, photos, voices or locations, and there
            is no chat or messaging of any kind.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Reel Math uses one cookie, <code className="rounded bg-line/50 px-1.5 py-0.5 text-sm">rm_session</code>,
            which keeps you signed in. It&apos;s required for the app to work. There are no advertising, analytics or
            third-party cookies.
          </p>
        </Section>

        <Section title="The AI word problems">
          <p>
            Tournament challenges are written by Claude, an AI model made by Anthropic. When a kid starts a challenge,
            Reel Math sends Anthropic a list of multiplication facts, such as &ldquo;7 × 8&rdquo;, and asks for fishing
            stories that use them. That&apos;s all that is sent: no nickname, account, email or any other information
            about your family. Every generated problem is checked by the app before a kid sees it, and replaced with a
            built-in problem if anything about it is wrong.
          </p>
        </Section>

        <Section title="Services that help run Reel Math">
          <Table
            rows={[
              ["Vercel", "Hosts the website. Like any web host, it keeps short-lived request logs that include IP addresses."],
              ["Neon", "Hosts the database that stores the information listed above."],
              ["Anthropic", "Writes the tournament word problems. Receives only multiplication facts, as described above."],
            ]}
          />
          <p className="mt-3">These services process data only to run Reel Math. Nothing is sold, rented or shared with anyone else.</p>
        </Section>

        <Section title="Kids' privacy">
          <p>
            Reel Math is designed so that kids don&apos;t give any personal information. Only a parent or guardian can
            create an account, and they choose what nickname each angler uses. Parents can see everything stored about
            each angler on the Progress report page, and delete it at any time.
          </p>
        </Section>

        <Section title="Keeping data safe">
          <p>
            All traffic is encrypted with HTTPS. Passwords and session tokens are stored only as hashes. Each family can
            only see its own anglers: every request checks that the angler belongs to the signed-in parent.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            Sign in and open <Link href="/account" className="font-bold text-water underline">Grown-up settings</Link>. You
            can delete a single angler, or delete your whole account. Deleting removes the data from the database right
            away, including all progress and catches, and it can&apos;t be undone. Data is otherwise kept until you
            delete it.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            {contact ? (
              <>
                Email <A href={`mailto:${contact}`}>{contact}</A> with any questions about your data, or if you need help
                deleting it.
              </>
            ) : (
              <>
                Questions about your data, or need help deleting it? <A href={`${REPO}/issues`}>Open an issue on GitHub</A>.
              </>
            )}
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If what Reel Math stores ever changes, this page will be updated first, and the date below will change.
          </p>
          <p className="mt-2 text-sm text-ink-soft">Last updated {UPDATED}.</p>
        </Section>
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-bold text-water underline" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y-2 divide-line overflow-hidden rounded-2xl border-2 border-line bg-card">
      {rows.map(([term, detail]) => (
        <div key={term} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="font-black">{term}</dt>
          <dd className="text-ink-soft">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
