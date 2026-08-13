import type { Metadata, Viewport } from "next";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const description =
  "Local delivery, live tracking, and photo proof of delivery for florists - the add-on that sits next to the POS you already use.";

// Without this, Next can't turn the relative /opengraph-image and
// /twitter-image routes into absolute URLs for link-preview cards, and
// silently falls back to http://localhost:3000 (a real build warning,
// and would have shipped broken preview images to production - exactly
// what opengraph-image.tsx exists to avoid). Falls back to the same
// localhost default only if NEXT_PUBLIC_SITE_URL is unset; set it in
// Vercel per README.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Florist Delivery Platform",
    template: "%s — Florist Delivery Platform",
  },
  description,
  openGraph: {
    title: "Florist Delivery Platform",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Florist Delivery Platform",
    description,
  },
};

// themeColor lives here, not in `metadata`, as of Next 14.2+ - it's a
// viewport-level concern (controls the mobile browser chrome color), not
// document metadata. Leaving it in `metadata` only produced a build-time
// warning here, not a failure, but worth clearing since it's a one-line fix.
export const viewport: Viewport = {
  themeColor: "#e11d48",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Every route change (Link clicks, router.push) gets a visible
            progress bar at the top instead of the page just snapping to
            the next thing - the "is this actually loading" cue most
            polished sites have and this one didn't. */}
        <NextTopLoader color="#e11d48" height={3} showSpinner={false} />
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}