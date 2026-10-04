export type PlayStyle = "singles" | "doubles" | "mixed" | "all";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string;
  skill_level: number | null;
  play_style: PlayStyle | null;
  location: string;
  paddle: string;
  created_at: string;
};

export type ProfileLite = Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "skill_level">;

export type Post = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  club_id: string | null;
  author: ProfileLite;
  club: { id: string; slug: string; name: string } | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type Comment = {
  id: string;
  content: string;
  created_at: string;
  author: ProfileLite;
};

export type Club = {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  cover_url: string | null;
  owner_id: string;
  created_at: string;
};

export type Court = {
  id: string;
  name: string;
  address: string;
  city: string;
  num_courts: number;
  indoor: boolean;
  lights: boolean;
  surface: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
};

export type ActionState = { error?: string; success?: string } | undefined;

export type NotificationType = "like" | "comment" | "follow" | "club_join";

export type AppNotification = {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | null;
  actor: ProfileLite | null;
  post: { id: string; content: string } | null;
  club: { slug: string; name: string } | null;
};
