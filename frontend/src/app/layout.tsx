import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Florist Delivery Platform",
  description: "Order, track, and deliver flowers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}