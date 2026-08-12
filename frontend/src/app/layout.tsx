import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const description =
  "Local delivery, live tracking, and photo proof of delivery for florists - the add-on that sits next to the POS you already use.";

export const metadata: Metadata = {
  title: {
    default: "Florist Delivery Platform",
    template: "%s — Florist Delivery Platform",
  },
  description,
  themeColor: "#e11d48",
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