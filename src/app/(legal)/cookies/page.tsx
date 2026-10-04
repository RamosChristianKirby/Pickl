import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <article>
      <h1>Cookie Policy</h1>
      <p className="lead">Last updated: {SITE.lastUpdated}</p>

      <p>
        Cookies are small files a website saves in your browser. Pickl keeps this simple: we only use cookies that are strictly needed for
        the site to work. We do not use advertising, analytics or tracking cookies, and we don&apos;t let other companies set cookies on Pickl.
      </p>

      <h2>Cookies we use</h2>
      <div className="not-prose overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Purpose</th>
              <th>Type</th>
              <th>How long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>sb-…-auth-token</code>
              </td>
              <td>Keeps you signed in to your Pickl account (set by Supabase, our sign-in provider).</td>
              <td>Essential</td>
              <td>Until you log out, or up to about a week without use</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Other storage</h2>
      <p>
        The site also saves one small setting in your browser&apos;s local storage (<code>pickl-cookie-notice</code>) so the cookie notice
        doesn&apos;t keep appearing. The mobile app stores your sign-in session on your device so you stay logged in.
      </p>

      <h2>Your choices</h2>
      <p>
        Because these cookies are essential, the site can&apos;t keep you signed in without them. You can delete them at any time by logging
        out or clearing your browser&apos;s cookies. If we ever add optional cookies, we will ask for your consent first, with a clear way to
        say no.
      </p>

      <p>
        More about how we handle data: <Link href="/privacy">Privacy Policy</Link>. Questions:{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </article>
  );
}
