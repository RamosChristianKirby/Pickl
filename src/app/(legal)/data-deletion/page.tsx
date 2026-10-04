import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Delete your data" };

export default function DataDeletionPage() {
  return (
    <article>
      <h1>Delete your account and data</h1>
      <p className="lead">You can delete your Pickl account yourself at any time. It takes effect immediately.</p>

      <h2>On the website</h2>
      <ol>
        <li>
          Log in and open <Link href="/settings">Settings</Link>.
        </li>
        <li>Scroll to <strong>Delete account</strong>, type DELETE to confirm, and press the button.</li>
      </ol>

      <h2>In the mobile app</h2>
      <ol>
        <li>Open the <strong>Profile</strong> tab, then <strong>Edit profile</strong>.</li>
        <li>Scroll down, tap <strong>Delete account</strong>, and confirm.</li>
      </ol>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your profile, profile and cover photos, and every photo you uploaded</li>
        <li>Your posts, comments, likes and follows</li>
        <li>Clubs you own (including their posts) and your club memberships</li>
        <li>Your check-ins, ranked matches you hosted, your match records and your Pickl Rating</li>
        <li>Your sign-in account and email address</li>
      </ul>
      <p>
        Courts you added stay in the shared directory but are no longer linked to you. Copies in our providers&apos; backups are removed on
        their normal schedule.
      </p>

      <h2>Can&apos;t log in?</h2>
      <p>
        Email <a href={`mailto:${SITE.contactEmail}?subject=Delete%20my%20Pickl%20account`}>{SITE.contactEmail}</a> from the email address on
        your account with the subject &ldquo;Delete my Pickl account&rdquo;. We will confirm and delete it within 15 working days. You can also
        ask us for a copy of your data the same way.
      </p>
    </article>
  );
}
