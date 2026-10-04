import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Pickl. Made for the kitchen line.</p>
      </div>

      <div className="relative hidden overflow-hidden bg-brand-800 lg:block">
        <CourtArt />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <span className="w-fit rounded-full bg-ball px-3 py-1 text-xs font-bold text-ink">The pickleball community</span>
          <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Find your people. Find your court. Find your game.
          </h2>
          <p className="mt-3 max-w-md text-brand-100">
            Share highlights, join local clubs and see who&apos;s checked in at the courts right now.
          </p>
        </div>
      </div>
    </div>
  );
}

function CourtArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="400" height="600" fill="#0d7a42" />
      <rect x="60" y="60" width="280" height="480" fill="#106038" stroke="#e6f7ec" strokeWidth="4" />
      <line x1="60" y1="300" x2="340" y2="300" stroke="#e6f7ec" strokeWidth="6" />
      <rect x="60" y="230" width="280" height="140" fill="#0f4f30" stroke="#e6f7ec" strokeWidth="4" />
      <line x1="200" y1="60" x2="200" y2="230" stroke="#e6f7ec" strokeWidth="4" />
      <line x1="200" y1="370" x2="200" y2="540" stroke="#e6f7ec" strokeWidth="4" />
      <circle cx="300" cy="140" r="26" fill="#d7f24a" />
      <g fill="#0d7a42" opacity=".5">
        <circle cx="292" cy="130" r="3.5" />
        <circle cx="306" cy="128" r="3.5" />
        <circle cx="312" cy="143" r="3.5" />
        <circle cx="290" cy="147" r="3.5" />
        <circle cx="302" cy="156" r="3.5" />
      </g>
      <rect width="400" height="600" fill="url(#fade)" />
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#032c19" stopOpacity="0" />
          <stop offset="1" stopColor="#032c19" stopOpacity="0.92" />
        </linearGradient>
      </defs>
    </svg>
  );
}
