import { redirect } from "next/navigation";
import { Bobber, Fish } from "@/components/Fish";
import { LinkButton, Waves } from "@/components/ui";
import { currentUser } from "@/lib/server/session";

export default async function Home() {
  if (await currentUser()) redirect("/anglers");

  return (
    <div className="min-h-dvh">
      <section className="bg-gradient-to-b from-sky to-water pt-10 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <Bobber className="animate-bob mx-auto h-16 w-12 text-ink" />
          <h1 className="mt-4 text-5xl font-black tracking-tight text-water-deep sm:text-6xl">Reel Math</h1>
          <p className="mx-auto mt-3 max-w-md text-lg font-semibold text-water-deep/80">
            Learn your times tables one bass at a time. Answer fast, land a lunker.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href="/signup">Start fishing</LinkButton>
            <LinkButton href="/login" variant="ghost">
              I have an account
            </LinkButton>
          </div>
          <Fish speciesId="largemouth" className="mx-auto mt-8 h-28 w-52" />
        </div>
        <Waves />
      </section>

      <section className="mx-auto grid max-w-3xl gap-4 px-4 py-10 sm:grid-cols-3">
        {[
          ["🎣", "Every answer is a cast", "Get it right and you land a bass. Faster answers land heavier fish."],
          ["🗺️", "Unlock new lakes", "Each times table is a lake. Hook most of the facts to open the next one."],
          ["🏆", "Tournament challenges", "Fishing story problems, written for the facts you find hardest."],
        ].map(([icon, title, body]) => (
          <div key={title} className="rounded-3xl border-2 border-line bg-card p-5">
            <div className="text-3xl">{icon}</div>
            <h2 className="mt-2 text-lg font-black">{title}</h2>
            <p className="mt-1 text-ink-soft">{body}</p>
          </div>
        ))}
      </section>
      <p className="pb-10 text-center text-sm text-ink-soft">
        A parent creates the account. Kids get a nickname and an avatar, and nothing else.
      </p>
    </div>
  );
}
