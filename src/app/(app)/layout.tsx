import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/NavTabs";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { requireViewer } from "@/lib/data";
import { profileHref } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();

  return (
    <>
      <Navbar viewer={viewer} />
      <div className="mx-auto grid max-w-7xl gap-6 px-3 pb-28 pt-3 sm:px-4 sm:pt-4 md:pb-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto pr-1 lg:block">
          <Suspense fallback={<SidebarSkeleton />}>
            <LeftSidebar viewer={viewer} />
          </Suspense>
        </aside>

        <main id="main" className="min-w-0">{children}</main>

        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto xl:block">
          <Suspense fallback={<SidebarSkeleton />}>
            <RightSidebar viewer={viewer} />
          </Suspense>
        </aside>
      </div>
      <MobileNav profilePath={profileHref(viewer.username)} />
    </>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-200/70" />
      ))}
    </div>
  );
}
