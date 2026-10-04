import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CookieNotice } from "@/components/CookieNotice";
import { THEME_SCRIPT } from "@/lib/theme";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pickl — The social network for pickleball players",
    template: "%s · Pickl",
  },
  description:
    "Connect with pickleball players near you, join clubs, find courts and see who's playing right now.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d7a42" },
    { media: "(prefers-color-scheme: dark)", color: "#0a101c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
