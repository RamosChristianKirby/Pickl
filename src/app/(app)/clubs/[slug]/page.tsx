import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Globe, Lock, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { RatingBadge } from "@/components/RatingBadge";
import { JoinClubButton } from "@/components/JoinClubButton";
import { PostComposer } from "@/components/PostComposer";
import { PostList } from "@/components/PostList";
import { RealtimeFeedBanner } from "@/components/RealtimeFeedBanner";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, PROFILE_LITE, hydratePosts, requireViewer } from "@/lib/data";
import type { Club, ProfileLite } from "@/lib/types";
import { profileHref } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("clubs").select("name").eq("slug", slug).maybeSingle();
  return { title: (data as { name: string } | null)?.name ?? "Club" };
}

export default async function ClubPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();

  const { data: clubRow } = await supabase.from("clubs").select("*").eq("slug", slug).maybeSingle();
  if (!clubRow) notFound();
  const club = clubRow as Club;

  const [{ data: memberRows, count: memberCount }, { data: postRows }] = await Promise.all([
    supabase
      .from("club_members")
      .select(`role, user_id, member:profiles!club_members_user_id_fkey ( ${PROFILE_LITE} )`, { count: "exact" })
      .eq("club_id", club.id)
      .order("joined_at", { ascending: true })
      .limit(24),
    supabase.from("posts").select(POST_SELECT).eq("club_id", club.id).order("created_at", { ascending: false }).limit(40),
  ]);

  type MemberRow = { role: string; user_id: string; member: ProfileLite | ProfileLite[] | null };
  const members = ((memberRows ?? []) as unknown as MemberRow[])
    .map((m) => ({
      role: m.role,
      user_id: m.user_id,
      profile: (Array.isArray(m.member) ? m.member[0] : m.member) ?? null,
    }))
    .filter((m) => m.profile);

  const isOwner = club.owner_id === viewer.id;
  let isMember = members.some((m) => m.user_id === viewer.id);
  if (!isMember && (memberCount ?? 0) > members.length) {
    const { data } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", club.id)
      .eq("user_id", viewer.id)
      .maybeSingle();
    isMember = Boolean(data);
  }

  const posts = await hydratePosts(postRows, viewer.id);
  const since = new Date(club.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="relative h-32 bg-linear-to-br from-brand-500 via-brand-700 to-brand-900 sm:h-48 lg:h-56">
          {club.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.cover_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{club.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                {club.visibility === "private" ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {club.visibility === "private" ? "Private club" : "Public club"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {memberCount ?? 0} members
              </span>
              {club.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {club.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Since {since}
              </span>
            </div>
            <div className="mt-3 flex -space-x-2">
              {members.slice(0, 8).map((m) => (
                <Avatar key={m.user_id} src={m.profile!.avatar_url} name={m.profile!.full_name || m.profile!.username} size="sm" />
              ))}
            </div>
          </div>
          <JoinClubButton clubId={club.id} isMember={isMember} isOwner={isOwner} isPrivate={club.visibility === "private"} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="order-2 space-y-4 lg:order-1">
          {isMember || isOwner ? (
            <>
              <PostComposer viewer={viewer} clubId={club.id} placeholder={`Share something with ${club.name}…`} />
              <RealtimeFeedBanner viewerId={viewer.id} clubId={club.id} />
              <PostList
                posts={posts}
                viewer={viewer}
                hideClub
                emptyTitle="No posts in this club yet"
                emptyDescription="Kick things off — share your next open play time or a recap from the last session."
              />
            </>
          ) : (
            <div className="card flex flex-col items-center gap-2 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                <Lock className="h-5 w-5 text-brand-600" />
              </span>
              <p className="font-semibold text-ink">Club posts are for members only</p>
              <p className="text-sm text-slate-500">
                {club.visibility === "private" ? "Ask a member for the club password, then join to see and share posts." : "Join this club to see and share posts."}
              </p>
            </div>
          )}
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <section className="card p-4">
            <h2 className="font-semibold text-ink">About</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {club.description || "This club hasn't added a description yet."}
            </p>
          </section>
          <section className="card p-4">
            <h2 className="font-semibold text-ink">Members</h2>
            <div className="mt-3 space-y-2">
              {members.map((m) => (
                <Link
                  key={m.user_id}
                  href={profileHref(m.profile!.username)}
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                >
                  <Avatar src={m.profile!.avatar_url} name={m.profile!.full_name || m.profile!.username} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.profile!.full_name || m.profile!.username}</p>
                    <RatingBadge rating={m.profile!.rating} />
                  </div>
                  {m.role !== "member" && (
                    <span className="rounded-full bg-ball px-2 py-0.5 text-[10px] font-bold uppercase text-navy">{m.role}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
