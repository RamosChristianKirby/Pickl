import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, Shield, Trophy, Users } from "lucide-react";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "A feed built for players",
    body: "Share match recaps, drills, paddle reviews and highlight photos. Like, comment and follow the players you love to watch.",
  },
  {
    icon: Users,
    title: "Clubs & groups",
    body: "Start a club for your regular crew or join local groups. Every club gets its own feed and member roster.",
  },
  {
    icon: MapPin,
    title: "Courts directory",
    body: "Find indoor and outdoor courts near you, add new ones, and check in so friends know where the games are.",
  },
  {
    icon: Trophy,
    title: "Skill ratings",
    body: "Show your level from 2.0 to 5.5 so you can find balanced games and players who push your game.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Join free
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-200">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> The home of pickleball players
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Your pickleball community,{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">all in one place.</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded bg-ball sm:h-4" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Dinkly connects players, clubs and courts. Post your wins, find your next doubles partner and see who&apos;s
              on the courts right now.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                Create your player profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                I already have an account
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <Shield className="h-4 w-4 text-brand-600" /> Free forever for players. No ads in your feed.
            </p>
          </div>

          <HeroPreview />
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink">Everything you need off the court</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Built by players, for players — from first-time dinkers to tournament regulars.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-800 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Ready to get out of the kitchen?</h2>
          <Link href="/signup" className="btn-ball px-6 py-3 text-base">
            Join Dinkly — it&apos;s free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-slate-400">© {new Date().getFullYear()} Dinkly</footer>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-ball/60 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-brand-300/50 blur-3xl" />
      <div className="relative space-y-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
              MR
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                Maya R. <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 ring-1 ring-amber-200">4.0</span>
              </p>
              <p className="text-xs text-slate-500">2h · Sunset Park Courts</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            Finally won the 3rd-shot drop battle today 🥒 Thanks to everyone at Saturday open play!
          </p>
          <div className="mt-3 h-36 rounded-xl bg-linear-to-br from-brand-500 to-brand-800" />
          <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500">
            <span>❤ 48 likes</span>
            <span>12 comments</span>
          </div>
        </div>
        <div className="card ml-10 flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Riverside Rec Center</p>
            <p className="text-xs text-slate-500">8 courts · Indoor · Lights</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            ● 14 playing now
          </span>
        </div>
      </div>
    </div>
  );
}
