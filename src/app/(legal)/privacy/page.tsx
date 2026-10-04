import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article>
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: {SITE.lastUpdated}</p>

      <p>
        This policy explains what personal information {SITE.name} (&ldquo;we&rdquo;) collects when you use the Pickl website and mobile
        app, why we collect it, and the choices you have. {SITE.name} is operated by {SITE.operator} in the {SITE.country}. We follow the
        Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules. Pickl is free and does not sell your data
        or show ads.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email address, password (stored only as a secure hash by our authentication provider), full
          name and username.
        </li>
        <li>
          <strong>Profile details you choose to add:</strong> profile and cover photos, bio, location (free text, e.g. a city), paddle,
          preferred format.
        </li>
        <li>
          <strong>Content you create:</strong> posts, photos, comments, likes, follows, club memberships, clubs and courts you add,
          check-ins (and their optional note), ranked match results and your Pickl Rating.
        </li>
        <li>
          <strong>Location (mobile app, optional):</strong> only when you tap &ldquo;Use my location&rdquo; while adding a court. We save the map
          pin for that court, not your personal location history.
        </li>
        <li>
          <strong>Camera (mobile app, optional):</strong> used only to scan QR codes and take photos you decide to post. Video from the
          scanner is never stored or uploaded.
        </li>
        <li>
          <strong>Consent records:</strong> the date you accepted these terms and confirmed your age.
        </li>
        <li>
          <strong>Technical data:</strong> sign-in session tokens and standard server logs (such as IP address and time of request) kept
          by our hosting providers for security.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> collect payment information, contacts, precise background location, or advertising identifiers, and we do
        not use analytics or tracking tools.
      </p>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run your account and show your profile, posts, clubs, courts and matches to other signed-in players.</li>
        <li>To build your feed (for example, showing posts from people you follow and similar-level players first).</li>
        <li>To calculate Pickl Ratings from ranked matches that both teams confirm.</li>
        <li>To send account emails such as sign-up confirmation and password reset.</li>
        <li>To keep Pickl secure, prevent abuse and fix problems.</li>
      </ul>
      <p>
        Our legal bases are your consent (given when you sign up, which you can withdraw by deleting your account) and what is needed to
        provide the service you asked for.
      </p>

      <h2>3. Who can see your information</h2>
      <ul>
        <li>Your profile, public posts, ratings, match results and check-ins are visible to other signed-in Pickl users. They are not visible to people who are not logged in.</li>
        <li>Club posts are visible only to members of that club. Private clubs and private matches need a password to join.</li>
        <li>Your email address is never shown to other users.</li>
      </ul>

      <h2>4. Service providers we use</h2>
      <p>We share data only with providers that help us run Pickl, under their own privacy and security terms:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, sign-in, file storage and real-time updates (stores your account and content).
        </li>
        <li>
          <strong>Vercel</strong> — hosts the website.
        </li>
        <li>
          <strong>Supabase Auth, and Google Gmail if we turn on our own email sender</strong> — deliver account emails.
        </li>
        <li>
          <strong>OpenStreetMap</strong> — map tiles for the courts map, and <strong>Nominatim</strong> — turns an address you type into a map
          pin. These services see the map area or address you look up, plus your IP address.
        </li>
        <li>
          <strong>unpkg (CDN)</strong> — delivers the open-source map library used inside the mobile app.
        </li>
        <li>
          <strong>Expo</strong> — the framework the mobile app is built with (no tracking is enabled).
        </li>
      </ul>
      <p>Some of these providers may store data outside the {SITE.country}. We do not sell or rent personal information to anyone.</p>

      <h2>5. Cookies</h2>
      <p>
        The website only uses essential cookies that keep you signed in. See our <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <h2>6. Emails</h2>
      <p>
        We only send emails needed for your account (confirmation and password reset). We do not send marketing or newsletter emails. If
        we ever do, they will only go to people who opt in, and each one will include an unsubscribe link.
      </p>

      <h2>7. How long we keep it</h2>
      <p>
        We keep your information while your account is open. When you delete your account, your profile, posts, comments, likes, follows,
        clubs you own, check-ins, match records and uploaded photos are deleted. Backups held by our providers are cleared on their normal
        schedule.
      </p>

      <h2>8. Your rights</h2>
      <p>Under the Data Privacy Act you have the right to:</p>
      <ul>
        <li>be informed about how your data is used (this policy);</li>
        <li>access your data and get a copy of it;</li>
        <li>correct inaccurate data (you can edit your profile at any time);</li>
        <li>object to processing and withdraw consent;</li>
        <li>have your data erased or blocked — see <Link href="/data-deletion">Delete your data</Link>;</li>
        <li>data portability; and</li>
        <li>file a complaint with the National Privacy Commission (privacy.gov.ph).</li>
      </ul>
      <p>
        To use any of these rights, email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. We will reply within 15
        working days.
      </p>

      <h2>9. Children</h2>
      <p>
        You must be at least {SITE.minAge} years old to use Pickl. If you are under 18, you need permission from a parent or guardian. We
        do not knowingly collect data from children under {SITE.minAge}; if you believe a child has signed up, contact us and we will delete
        the account.
      </p>

      <h2>10. Security</h2>
      <p>
        Data is sent over encrypted connections. Each player can only change their own data, passwords are hashed, and club and match
        passwords are stored as one-way hashes. No system is perfectly secure, so please use a strong, unique password.
      </p>

      <h2>11. Changes</h2>
      <p>If we change this policy we will update the date above and, for important changes, let you know in the app.</p>

      <h2>12. Contact</h2>
      <p>
        {SITE.operator} ({SITE.name}), {SITE.country} — <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
      </p>
    </article>
  );
}
