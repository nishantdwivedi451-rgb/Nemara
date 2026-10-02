import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Instrument_Sans, Caveat } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/base.css";
import { SITE, siteUrl } from "@/lib/site";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--ff-serif", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--ff-sans", display: "swap" });
const hand = Caveat({ subsets: ["latin"], weight: ["500"], variable: "--ff-hand", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Nemara — Wear Your Story", template: "%s — Nemara" },
  description: SITE.description,
  applicationName: "Nemara",
  keywords: ["Nemara", "fashion jewellery India", "designer jewellery", "artisan jewellery", "jhumka", "kada", "necklace set", "Pratima Saxena"],
  openGraph: { siteName: "Nemara", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#F7F3EC", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Root shell shared by the storefront `(store)` and the Nemara Studio `admin` areas. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
