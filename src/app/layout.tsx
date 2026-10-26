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

const FALLBACK_SITE_URL = "https://vorguegarb.netlify.app";

/**
 * metadataBase is cosmetic — it only makes OG image paths absolute — but
 * `new URL()` throws on anything malformed, which fails the whole build while
 * collecting page data. Netlify has handed us both an empty string and a
 * masked placeholder, so treat the variable as untrusted and fall back rather
 * than let a canonical URL take the site down.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).toString();
  } catch {
    console.warn(`Ignoring malformed NEXT_PUBLIC_SITE_URL; using ${FALLBACK_SITE_URL}`);
    return FALLBACK_SITE_URL;
  }
}

const siteUrl = resolveSiteUrl();

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
