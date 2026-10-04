import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article>
      <h1>Terms of Service</h1>
      <p className="lead">Last updated: {SITE.lastUpdated}</p>

      <p>
        These terms are an agreement between you and {SITE.operator}, who runs {SITE.name} (&ldquo;Pickl&rdquo;, &ldquo;we&rdquo;). By creating
        an account or using the Pickl website or app, you agree to them and to our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. Who can use Pickl</h2>
      <p>
        You must be at least {SITE.minAge} years old. If you are under 18, you confirm that a parent or guardian has agreed to these terms
        for you. You are responsible for keeping your password safe and for everything done with your account.
      </p>

      <h2>2. Pickl is free</h2>
      <p>Pickl is currently free to use. There are no subscriptions, in-app purchases or hidden charges.</p>

      <h2>3. Your content</h2>
      <p>
        You keep ownership of the posts, photos and other content you share. You give us a non-exclusive, worldwide, royalty-free licence to
        store, display and share that content inside Pickl so the service can work (for example, showing your post to your followers). This
        licence ends when you delete the content or your account. Only post content you have the right to share.
      </p>

      <h2>4. Community rules</h2>
      <p>Don&apos;t use Pickl to:</p>
      <ul>
        <li>harass, threaten, bully or discriminate against anyone;</li>
        <li>post illegal, sexual, violent or hateful content, or anything involving minors that is inappropriate;</li>
        <li>impersonate someone, post fake reviews, or mislead people;</li>
        <li>share other people&apos;s private information without permission;</li>
        <li>spam, scam or advertise without permission;</li>
        <li>break, overload or try to get around Pickl&apos;s security, or scrape other users&apos; data.</li>
      </ul>

      <h2>5. Ranked matches and ratings</h2>
      <p>
        Pickl Ratings and skill levels are for fun and community matchmaking only. They are not official ratings (such as DUPR or
        tournament ratings). Ratings change only when both teams confirm a result. Deliberately reporting false results is against these
        rules, and we may reset ratings or remove accounts that do it.
      </p>

      <h2>6. Courts, clubs and meetups</h2>
      <p>
        Court details and check-ins are added by players and may be out of date. Pickl does not own, run or inspect any court or club. You
        take part in games and meetups at your own risk — play safely, follow venue rules, and only meet people you are comfortable with.
      </p>

      <h2>7. Removing content and accounts</h2>
      <p>
        We may remove content or suspend accounts that break these terms or the law. You can delete your account at any time from Settings
        — see <Link href="/data-deletion">Delete your data</Link>.
      </p>

      <h2>8. No warranty</h2>
      <p>
        Pickl is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We work hard to keep it running, but we can&apos;t promise it will
        always be available or error-free.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent allowed by law, we are not liable for indirect or consequential losses, or for injuries, disputes or losses arising
        from games, meetups or content posted by other users. Nothing in these terms limits rights you have under Philippine consumer law
        that cannot be excluded.
      </p>

      <h2>10. Changes to Pickl or these terms</h2>
      <p>
        We may update Pickl and these terms. If we make important changes we will update the date above and let you know in the app.
        Continuing to use Pickl after that means you accept the new terms.
      </p>

      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of the Republic of the Philippines. Disputes will be handled by the proper courts of the Philippines.</p>

      <h2>12. Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </article>
  );
}
