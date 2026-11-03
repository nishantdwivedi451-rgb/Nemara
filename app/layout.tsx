import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lora, Cinzel, Great_Vibes } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/base.css";
import { SITE, siteUrl } from "@/lib/site";

// Type from the brand card: classical caps (Cinzel), a garamond for display, a book serif for reading, a script for the personal notes.
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--ff-serif", display: "swap" });
const sans = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-sans", display: "swap" });
const caps = Cinzel({ subsets: ["latin"], weight: ["500", "600"], variable: "--ff-caps", display: "swap" });
const hand = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--ff-hand", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Nemara — Your Jewellery Wardrobe", template: "%s — Nemara" },
  description: SITE.description,
  applicationName: "Nemara",
  keywords: ["Nemara", "fashion jewellery India", "designer jewellery", "artificial jewellery", "premium fashion jewellery", "curated jewellery", "jhumka", "kada", "necklace set", "Jaipur jewellery"],
  openGraph: { siteName: "Nemara", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#F4EDF7", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Root shell shared by the storefront `(store)` and the Nemara Studio `admin` areas. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable} ${caps.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
