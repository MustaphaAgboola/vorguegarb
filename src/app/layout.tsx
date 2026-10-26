import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// `||`, not `??`: Netlify can hand us an empty string, and new URL("") throws
// at build time. Only `||` treats "" as absent.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vorguegarb.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VogueGarb — Fashion design & styling, Lagos",
    template: "%s · VogueGarb",
  },
  description:
    "Shop bespoke Ankara, Aso Oke and ready-to-wear pieces from VogueGarb, Lagos. Sign in with Google and check out in minutes.",
  openGraph: {
    type: "website",
    siteName: "VogueGarb",
    title: "VogueGarb — Fashion design & styling, Lagos",
    description:
      "Bespoke Ankara, Aso Oke and ready-to-wear, made to order in Lagos.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "VogueGarb — Fashion design & styling, Lagos",
    description:
      "Bespoke Ankara, Aso Oke and ready-to-wear, made to order in Lagos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-dvh flex-col bg-paper font-sans text-ink antialiased">
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-10 sm:px-8 sm:py-16">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
