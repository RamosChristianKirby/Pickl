import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Pencil, Swords, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { RatingBadge } from "@/components/RatingBadge";
import { FollowButton } from "@/components/FollowButton";
import { ProfilePhotoButton } from "@/components/ProfilePhotoButton";
import { PostComposer } from "@/components/PostComposer";
import { PostList } from "@/components/PostList";
import { ClubThumb } from "@/components/LeftSidebar";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, findProfileByUsername, getMyClubs, hydratePosts, requireViewer } from "@/lib/data";
import { PLAY_STYLE_LABEL, safeDecode } from "@/lib/utils";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${safeDecode(username)}` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();

  const profile = await findProfileByUsername(username);
  if (!profile) notFound();
  const isMe = profile.id === viewer.id;

  const [{ count: followers }, { count: followingCount }, { data: amFollowing }, { data: postRows }, clubs, { count: postCount }] =
    await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("following_id", profile.id)
        .maybeSingle(),
      supabase.from("posts").select(POST_SELECT).eq("author_id", profile.id).order("created_at", { ascending: false }).limit(40),
      getMyClubs(profile.id),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", profile.id),
    ]);

  // Ranked matches played in the mobile app (only completed ones count).
  const { data: matchRows } = await supabase
    .from("match_players")
    .select("team, match:matches!inner ( status, winning_team )")
    .eq("user_id", profile.id)
    .eq("match.status", "completed")
    .limit(500);
  const record = { wins: 0, losses: 0 };
  for (const row of (matchRows ?? []) as unknown as { team: number; match: { winning_team: number | null } | { winning_team: number | null }[] }[]) {
    const m = Array.isArray(row.match) ? row.match[0] : row.match;
    if (!m?.winning_team) continue;
    if (m.winning_team === row.team) record.wins += 1;
    else record.losses += 1;
  }

  const posts = await hydratePosts(postRows, viewer.id);
  const name = profile.full_name || profile.username;
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="relative h-32 bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 sm:h-48 lg:h-56">
          {profile.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <CourtLines />
          )}
          {isMe && (
            <ProfilePhotoButton kind="cover" userId={viewer.id} hasPhoto={Boolean(profile.cover_url)} className="absolute bottom-3 right-3" />
          )}
        </div>

        <div className="px-4 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
              {/* Only the photo overlaps the cover; it sits above it with z-10. */}
              <div className="relative z-10 -mt-12 w-fit sm:-mt-16">
                <Avatar src={profile.avatar_url} name={name} size="profile" className="ring-4" />
                {isMe && (
                  <ProfilePhotoButton
                    kind="avatar"
                    userId={viewer.id}
                    hasPhoto={Boolean(profile.avatar_url)}
                    className="absolute bottom-1 right-1"
                  />
                )}
              </div>
              <div className="sm:pt-4">
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{name}</h1>
                <p className="text-sm text-slate-500">@{profile.username}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong className="text-ink">{postCount ?? posts.length}</strong> <span className="text-slate-500">posts</span>
                  </span>
                  <span>
                    <strong className="text-ink">{followers ?? 0}</strong> <span className="text-slate-500">followers</span>
                  </span>
                  <span>
                    <strong className="text-ink">{followingCount ?? 0}</strong> <span className="text-slate-500">following</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="sm:pt-4">
              {isMe ? (
                <Link href="/settings" className="btn-secondary">
                  <Pencil className="h-4 w-4" /> Edit profile
                </Link>
              ) : (
                <FollowButton targetId={profile.id} initiallyFollowing={Boolean(amFollowing)} />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="font-semibold text-ink">Player card</h2>
            {profile.bio && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{profile.bio}</p>}
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Skill level</dt>
                <dd>
                  <RatingBadge rating={profile.rating} showLabel />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Ranked record</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {record.wins}W – {record.losses}L
                </dd>
              </div>
              {profile.play_style && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Plays</dt>
                  <dd className="font-medium text-ink">{PLAY_STYLE_LABEL[profile.play_style]}</dd>
                </div>
              )}
              {profile.paddle && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-slate-500">
                    <Swords className="h-4 w-4" /> Paddle
                  </dt>
                  <dd className="truncate font-medium text-ink">{profile.paddle}</dd>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-4 w-4" /> Location
                  </dt>
                  <dd className="truncate font-medium text-ink">{profile.location}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <CalendarDays className="h-4 w-4" /> Joined
                </dt>
                <dd className="font-medium text-ink">{joined}</dd>
              </div>
            </dl>
            {isMe && !profile.bio && !profile.play_style && (
              <Link href="/settings" className="btn-ball mt-4 w-full">
                Complete your player card
              </Link>
            )}
          </section>

          <section className="card p-4">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Users className="h-4 w-4 text-brand-600" /> Clubs
            </h2>
            <div className="mt-3 space-y-2">
              {clubs.length === 0 && <p className="text-sm text-slate-500">Not in any clubs yet.</p>}
              {clubs.map((c) => (
                <Link key={c.id} href={`/clubs/${c.slug}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                  <ClubThumb name={c.name} src={c.cover_url} />
                  <span className="truncate text-sm font-medium text-ink">{c.name}</span>
                  {c.role === "owner" && (
                    <span className="ml-auto rounded-full bg-ball px-2 py-0.5 text-[10px] font-bold uppercase text-navy">Owner</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          {isMe && <PostComposer viewer={viewer} />}
          <PostList
            posts={posts}
            viewer={viewer}
            emptyTitle={isMe ? "You haven't posted yet" : `${name.split(" ")[0]} hasn't posted yet`}
          />
        </div>
      </div>
    </div>
  );
}

function CourtLines() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect x="40" y="20" width="720" height="180" fill="none" stroke="white" strokeWidth="3" />
      <line x1="400" y1="20" x2="400" y2="200" stroke="white" strokeWidth="5" />
      <line x1="300" y1="20" x2="300" y2="200" stroke="white" strokeWidth="3" />
      <line x1="500" y1="20" x2="500" y2="200" stroke="white" strokeWidth="3" />
      <line x1="40" y1="110" x2="300" y2="110" stroke="white" strokeWidth="3" />
      <line x1="500" y1="110" x2="760" y2="110" stroke="white" strokeWidth="3" />
    </svg>
  );
}
