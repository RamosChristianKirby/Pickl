import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Licenses & credits" };

const ITEMS: { name: string; use: string; license: string; url: string }[] = [
  { name: "Plus Jakarta Sans", use: "Website font", license: "SIL Open Font License 1.1", url: "https://fonts.google.com/specimen/Plus+Jakarta+Sans" },
  { name: "Lucide", use: "Website icons", license: "ISC License", url: "https://lucide.dev/license" },
  { name: "Ionicons", use: "App icons", license: "MIT License", url: "https://github.com/ionic-team/ionicons" },
  { name: "Leaflet", use: "Courts map", license: "BSD 2-Clause License", url: "https://leafletjs.com" },
  { name: "OpenStreetMap", use: "Map data and tiles", license: "Open Database License (ODbL) — © OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright" },
  { name: "Nominatim", use: "Address search for court pins", license: "OpenStreetMap data, ODbL", url: "https://nominatim.org" },
  { name: "Next.js, React, React Native, Expo", use: "App frameworks", license: "MIT License", url: "https://github.com/vercel/next.js" },
  { name: "Supabase client libraries", use: "Database and sign-in", license: "MIT License", url: "https://github.com/supabase/supabase-js" },
  { name: "Tailwind CSS", use: "Website styling", license: "MIT License", url: "https://tailwindcss.com" },
  { name: "react-native-qrcode-svg", use: "QR codes in the app", license: "MIT License", url: "https://github.com/awesomejerry/react-native-qrcode-svg" },
];

export default function LicensesPage() {
  return (
    <article>
      <h1>Licenses &amp; credits</h1>
      <p className="lead">{SITE.name} is built with these open-source projects and openly licensed resources. Thank you to everyone who makes them.</p>

      <div className="not-prose overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Used for</th>
              <th>License</th>
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((i) => (
              <tr key={i.name}>
                <td>
                  <a href={i.url} target="_blank" rel="noopener noreferrer">
                    {i.name}
                  </a>
                </td>
                <td>{i.use}</td>
                <td>{i.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Images</h2>
      <p>
        The Pickl logo, court illustrations and app icons were made for Pickl. Photos in posts, profiles and clubs belong to the players who
        uploaded them. Skill-level names follow the commonly used pickleball rating scale (1.0–5.5+).
      </p>
    </article>
  );
}
