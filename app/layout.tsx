import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Instrument_Serif, Instrument_Sans, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/pages.css";
import { StoreProvider } from "@/components/layout/StoreProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Toast } from "@/components/layout/Toast";
import { PreviewRibbon } from "@/components/layout/PreviewRibbon";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { JsonLd } from "@/components/editorial/JsonLd";
import { commerce } from "@/lib/commerce";
import { PREVIEW_MODE, SITE, siteUrl, whatsappUrl } from "@/lib/site";
import { organizationLd } from "@/lib/seo";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, occasions, collections] = await Promise.all([commerce.getCategories(), commerce.getOccasions(), commerce.getCollections()]);
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable} ${hand.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <StoreProvider>
          {PREVIEW_MODE && <PreviewRibbon />}
          <Header nav={{ categories, occasions, collections }} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer freeShippingThreshold={SITE.shipping.freeShippingThreshold} flatRate={SITE.shipping.flatRate} />
          <SearchOverlay />
          <MobileTabBar />
          <WhatsAppButton href={whatsappUrl()} />
          <Toast />
        </StoreProvider>
        <Suspense fallback={null}><AnalyticsScripts /></Suspense>
        <Analytics />
        <JsonLd data={organizationLd()} />
      </body>
    </html>
  );
}
