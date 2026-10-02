import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "VogueGarb — Fashion design & styling, Lagos",
    template: "%s · VogueGarb",
  },
  description:
    "Shop bespoke Ankara, Aso Oke and ready-to-wear pieces from VogueGarb, Lagos. Sign in with Google and check out in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-stone-50 text-stone-900 antialiased">
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
