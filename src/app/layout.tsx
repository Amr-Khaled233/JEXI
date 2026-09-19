import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/settings";
import "./globals.css";

// Every page reads live catalog/stock data from the database.
export const dynamic = "force-dynamic";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "JEXI Accessories | Timeless everyday jewelry", template: "%s | JEXI Accessories" },
  description: "Necklaces, hand chains, charms, rings, earrings and bracelets in gold, silver and rose gold. Free shipping across Egypt.",
  openGraph: { siteName: "JEXI Accessories", type: "website", images: ["/brand/logo-hero.jpg"] },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0a07" },
    { media: "(prefers-color-scheme: light)", color: "#f8f3ea" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings().catch(() => null);
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider defaultTheme={settings?.defaultTheme ?? "dark"}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
