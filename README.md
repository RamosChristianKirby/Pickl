# Dinkly — the social network for pickleball players

A Facebook-style community app for pickleball players, built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4** and **Supabase** (Postgres, Auth, Storage).

## Features

- **Accounts**: email/password sign-up and login, session handled by Supabase SSR cookies, protected routes via middleware.
- **Player profiles**: avatar, cover photo, bio, skill rating (2.0–5.5), preferred format, paddle, location, follower counts.
- **News feed**: text + photo posts, likes, comments, delete your own posts, and "Everyone" / "Following" tabs.
- **Follow system**: follow players, with player suggestions near your skill level.
- **Clubs**: create a club (with cover photo), join or leave, member roster, and a feed only club members can post to.
- **Courts directory**: browse and search courts, filter indoor/outdoor, add new courts, **check in** to show you're playing now, and see the live "On court now" list.
- **Notifications**: bell with live alerts for likes, comments, new followers and club joins.
- **Live feed**: a "new posts" button appears as soon as someone posts — no refresh needed.
- **Court map**: OpenStreetMap view of all courts (with live check-in counts), plus a pin picker when adding a court.
- **Search** across players, clubs and courts, plus a **Players** page with skill and format filters.
- Responsive three-column desktop layout, plus a bottom tab bar on mobile.
- Row Level Security on every table, so users can only change their own data.

## 1. Create a Supabase project

1. Go to <https://supabase.com>, create a free project, and wait for it to finish setting up.
2. Open **SQL Editor → New query**, paste in all of [`supabase/setup.sql`](supabase/setup.sql), and click **Run**.
   This creates every table, security policy, trigger, the public `media` storage bucket and realtime settings.
   It's safe to run again — do so whenever you pull updates. (`schema.sql` + `migrations/` contain the same SQL split into steps.)
3. *(Optional)* Run [`supabase/seed.sql`](supabase/seed.sql) to add 3 placeholder courts.
4. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/**`
5. *(Optional — requires custom SMTP on Supabase's free plan)* **Make the confirmation link work in any browser or device**: go to **Authentication → Emails → Templates → Confirm signup** and replace the link with:
   ```html
   <h2>Confirm your signup</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/settings">Confirm your email</a></p>
   ```
6. *(Optional, for faster local testing)* Turn off **Authentication → Sign In / Providers → Email → Confirm email**, so new accounts can log in without confirming their email first.

## 2. Configure environment variables

```bash
cp env.example .env.local   # Windows PowerShell: Copy-Item env.example .env.local
```

Fill in the values from **Project Settings → API** (or **Connect**):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

## 3. Run it

Requires Node.js 18.18 or later (Node 20+ recommended).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, create an account, and fill in your player card.

Production build:

```bash
npm run build
npm start
```

## Project structure

```
src/
  app/
    page.tsx                 Public landing page
    (auth)/login, signup     Auth pages + server actions
    auth/callback, signout   Email-confirmation and logout routes
    (app)/                   Signed-in area (shared navbar + sidebars)
      feed/                  News feed
      u/[username]/          Player profile
      settings/              Edit profile and photo uploads
      players/               Discover players
      notifications/         All notifications
      clubs/ (+ new, [slug]) Clubs
      courts/ (+ new, [id])  Courts directory and check-ins
      post/[id]/             Single post with comments
      search/                Global search
  components/                UI components (PostCard, Composer, Navbar, ...)
  lib/
    supabase/                Browser, server and middleware clients
    actions/                 Server actions (posts, likes, follows, clubs, courts, profile)
    data.ts                  Shared queries
  middleware.ts              Session refresh + route protection
supabase/
  schema.sql                 Database schema, RLS policies, storage
  seed.sql                   Optional sample courts
```

## Security

- **Emails stay private.** Supabase keeps emails in its private `auth` schema, which the API never exposes. The app's own tables don't store emails, and login/sign-up errors are generic, so the forms can't be used to check whether an email has an account.
- **Signed-in only.** Every table has Row Level Security. Reading data requires being logged in, and people can only change their own rows.
- **Locked-down functions.** Internal database functions (e.g. the one that creates notifications) can't be called through the API.
- **Uploads.** The `media` bucket accepts only images (JPG/PNG/WebP/GIF) up to 5 MB, uploads go into the uploader's own folder, and saved image links must point at that folder.
- **Browser protections.** `next.config.ts` sends a Content-Security-Policy, clickjacking protection (`X-Frame-Options: DENY`), `nosniff`, a strict referrer policy and HSTS in production.
- **Keep secrets secret.** Only the URL and the publishable/anon key belong in `.env.local`. Never put the `service_role`/secret key in the app or commit `.env.local` to Git.

## Hidden sections

Feature switches live in `src/lib/features.ts`. The Players page is currently turned off (`players: false`):
it's removed from the menus and `/players` returns 404. Set it to `true` to bring it back.

## Deploying to Vercel

1. Push the project to GitHub and import it in Vercel.
2. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables.
3. In Supabase **URL Configuration**, add your production URL and `https://your-domain/auth/callback`.

## Ideas for next steps

- Push / email notifications
- Group chats for clubs and games
- Ladder / league standings and match score tracking
