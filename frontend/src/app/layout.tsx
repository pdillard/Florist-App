import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart/CartContext";
import { CartCount } from "@/components/cart/CartCount";

export const metadata: Metadata = {
  title: "Florist Delivery Platform",
  description: "Order, track, and deliver flowers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className="flex items-center justify-between border-b p-4">
            <span className="font-semibold">Florist Delivery</span>
            <CartCount />
          </header>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}