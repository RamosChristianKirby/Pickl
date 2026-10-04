import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Heart,
  Home,
  ImagePlus,
  MapPin,
  MessageCircle,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "A feed for your game",
    body: "Share match recaps, drills and photos. Like, comment on and follow the players you play with.",
  },
  {
    icon: Users,
    title: "Clubs",
    body: "Start a club for your regular group or join one nearby. Each club has its own feed and member list.",
  },
  {
    icon: MapPin,
    title: "Courts directory & map",
    body: "Browse indoor and outdoor courts on a map, add new ones and get directions in a tap.",
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "Know when someone likes or comments on your post, follows you or joins your club.",
  },
];

const STEPS = [
  { title: "Create your player profile", body: "Add your photo, preferred format and home courts. Everyone starts at level 2.0 and climbs with ranked matches in the app." },
  { title: "Find your people", body: "Follow players, join local clubs and see what your community is posting." },
  { title: "Get on court", body: "Check in at a court so others know you're there, and share how it went." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Sections">
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#courts" className="transition hover:text-ink">
              Courts
            </a>
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost px-3 sm:px-4">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary px-4">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(15_23_42/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42/0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20 lg:pb-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Built for the pickleball community
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink [text-wrap:balance] sm:text-6xl">
            Where pickleball players <span className="text-brand-700">connect</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 [text-wrap:pretty] sm:text-lg">
            Pickl brings your players, clubs and courts together in one place. Share your game, find partners at your
            level and see who&apos;s on court right now.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
              Create your free profile <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn w-full border border-slate-200 bg-white px-6 py-3 text-base text-ink hover:bg-slate-50 sm:w-auto">
              Log in
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {["Free to join", "Clubs & courts", "Live check-ins"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand-600" /> {t}
              </li>
            ))}
          </ul>

          <ProductPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Everything you need off the court</h2>
            <p className="mt-4 text-slate-600">
              Everything a pickleball community needs, from first-time dinkers to tournament regulars.
            </p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courts highlight */}
      <section id="courts" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Courts</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Know where the games are</h2>
            <p className="mt-4 text-slate-600">
              Every court in the directory shows who&apos;s checked in right now. Add the courts you play at, pin them on the
              map and leave a note when you&apos;re looking for a partner.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Indoor and outdoor courts, with surface, lights and number of courts",
                "Live “on court now” list from check-ins in the last few hours",
                "Map view with one-tap directions",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <CourtsPreview />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Up and running in a minute</h2>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand-900 px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-ball/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
          <LogoMark className="relative mx-auto h-12 w-12" />
          <h2 className="relative mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
            Your next game starts here
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-100">
            Join Pickl to connect with players, clubs and courts near you.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-ball w-full px-6 py-3 text-base sm:w-auto">
              Create your free profile <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn w-full px-6 py-3 text-base text-white ring-1 ring-white/30 hover:bg-white/10 sm:w-auto">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span>The social network for pickleball players.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <Link href="/login" className="hover:text-ink">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-ink">
              Sign up
            </Link>
            <span>© {new Date().getFullYear()} Pickl</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** A static illustration of the app, styled like a browser window. */
function ProductPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl sm:mt-16" aria-hidden>
      <div className="absolute -inset-x-6 -bottom-6 top-10 rounded-[2rem] bg-linear-to-b from-brand-100/60 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl shadow-slate-900/10">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          <div className="mx-auto hidden w-64 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs text-slate-400 ring-1 ring-slate-200 sm:flex">
            Pickl — Home
          </div>
        </div>

        {/* App top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7" />
            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-400 sm:flex">
              <Search className="h-3.5 w-3.5" /> Search Pickl
            </div>
          </div>
          <div className="hidden items-center gap-10 text-slate-400 md:flex">
            <Home className="h-5 w-5 text-brand-700" />
            <Users className="h-5 w-5" />
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <span className="h-7 w-7 rounded-full bg-linear-to-br from-amber-200 to-amber-400" />
          </div>
        </div>

        {/* App body */}
        <div className="grid gap-4 bg-slate-50 p-4 md:grid-cols-[180px_minmax(0,1fr)_220px]">
          <div className="hidden space-y-1 md:block">
            {[
              { icon: Home, label: "Home", active: true },
              { icon: Users, label: "Clubs" },
              { icon: MapPin, label: "Courts" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium ${active ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200" : "text-slate-600"}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${active ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </div>
            ))}
            <p className="px-2.5 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your clubs</p>
            {["Northside Dinkers", "Sunrise Open Play"].map((c) => (
              <div key={c} className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600">
                <span className="h-5 w-5 rounded bg-linear-to-br from-brand-500 to-brand-800" />
                {c}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <span className="h-8 w-8 rounded-full bg-linear-to-br from-amber-200 to-amber-400" />
              <span className="flex-1 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-400">What&apos;s happening on the court?</span>
              <ImagePlus className="h-4 w-4 text-brand-600" />
            </div>
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <div className="flex items-center gap-2.5 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-800">JR</span>
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Jordan R.{" "}
                    <span className="ml-1 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-200">
                      3.5
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">in Northside Dinkers · 1h</p>
                </div>
              </div>
              <p className="px-3 text-xs text-slate-700">Great turnout at Saturday open play. Same time next week?</p>
              <div className="mx-3 mt-3 h-28 rounded-lg bg-linear-to-br from-brand-500 via-brand-700 to-brand-900 sm:h-36">
                <svg viewBox="0 0 400 140" className="h-full w-full opacity-30" preserveAspectRatio="none">
                  <rect x="20" y="15" width="360" height="110" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="200" y1="15" x2="200" y2="125" stroke="white" strokeWidth="3" />
                  <line x1="150" y1="15" x2="150" y2="125" stroke="white" strokeWidth="2" />
                  <line x1="250" y1="15" x2="250" y2="125" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <div className="mx-3 mt-2 grid grid-cols-3 border-t border-slate-100 py-1.5 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center justify-center gap-1 text-rose-600">
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> Like
                </span>
                <span className="flex items-center justify-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> Comment
                </span>
                <span className="flex items-center justify-center gap-1">
                  <UserPlus className="h-3.5 w-3.5" /> Follow
                </span>
              </div>
            </div>
          </div>

          <div className="hidden space-y-3 md:block">
            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="flex items-center justify-between text-xs font-semibold text-ink">
                On court now
                <span className="flex items-center gap-1 text-[10px] text-brand-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Live
                </span>
              </p>
              {["Riverside Rec Center", "Sunset Park Courts"].map((c, i) => (
                <div key={c} className="mt-2.5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                    <MapPin className="h-3 w-3" />
                  </span>
                  <span className="flex-1 truncate text-[11px] text-slate-700">{c}</span>
                  <span className="rounded-full bg-brand-50 px-1.5 text-[10px] font-semibold text-brand-700">{i === 0 ? 6 : 3}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-ink">Players to follow</p>
              {["Alex T.", "Sam K."].map((n) => (
                <div key={n} className="mt-2.5 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-slate-200" />
                  <span className="flex-1 text-[11px] text-slate-700">{n}</span>
                  <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">Follow</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Static illustration of the courts directory. */
function CourtsPreview() {
  const courts = [
    { name: "Riverside Rec Center", meta: "8 courts · Indoor · Lights", live: 6 },
    { name: "Sunset Park Courts", meta: "6 courts · Outdoor · Lights", live: 3 },
    { name: "Lakeside Community Club", meta: "4 courts · Outdoor", live: 0 },
  ];
  return (
    <div className="relative" aria-hidden>
      <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-brand-100/70 via-transparent to-ball/30 blur-2xl" />
      <div className="relative space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5">
        <div className="relative h-40 overflow-hidden rounded-xl bg-[#e8efe9]">
          <svg viewBox="0 0 400 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
            <path d="M0 110 C80 90 120 130 200 105 S320 70 400 95 L400 160 L0 160Z" fill="#cfe3f2" />
            <path d="M0 40 L400 70" stroke="#ffffff" strokeWidth="6" />
            <path d="M120 0 L170 160" stroke="#ffffff" strokeWidth="6" />
            <path d="M290 0 L260 160" stroke="#ffffff" strokeWidth="4" />
          </svg>
          {[
            { x: "28%", y: "38%", n: 6 },
            { x: "62%", y: "52%", n: 3 },
            { x: "80%", y: "28%", n: 0 },
          ].map((p, i) => (
            <span key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p.x, top: p.y }}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full rounded-bl-none border-2 border-white shadow ${p.n ? "bg-brand-500" : "bg-brand-700"}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-ball" />
              </span>
              {p.n > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{p.n}</span>
              )}
            </span>
          ))}
        </div>
        {courts.map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
              <p className="truncate text-xs text-slate-500">{c.meta}</p>
            </div>
            {c.live > 0 ? (
              <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                {c.live} playing
              </span>
            ) : (
              <span className="shrink-0 text-xs text-slate-400">Quiet now</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
