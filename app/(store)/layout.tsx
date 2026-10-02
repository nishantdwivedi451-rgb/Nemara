import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/components.css";
import "@/styles/pages.css";
import "@/styles/tryon.css";
import "@/styles/circle.css";
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
import { CircleInvite } from "@/components/marketing/CircleInvite";
import { JsonLd } from "@/components/editorial/JsonLd";
import { commerce } from "@/lib/commerce";
import { getMarketingSettings } from "@/lib/marketing";
import { PREVIEW_MODE, SITE, whatsappUrl } from "@/lib/site";
import { organizationLd } from "@/lib/seo";
import { storeConfigured } from "@/lib/store";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, occasions, collections, products, marketing] = await Promise.all([
    commerce.getCategories(), commerce.getOccasions(), commerce.getCollections(), commerce.getProducts(), getMarketingSettings(),
  ]);
  const exclusives = products.filter((p) => p.exclusive).concat(products.filter((p) => !p.exclusive && p.featured)).slice(0, 3)
    .map((p) => ({ handle: p.handle, name: p.name, image: p.images[1]?.src ?? p.images[0].src }));
  return (
    <>
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
        {/* never collect details we can't store: the Circle switches on once a database is connected */}
        <CircleInvite settings={{ ...marketing.popup, enabled: marketing.popup.enabled && storeConfigured() }} track={storeConfigured()} exclusives={exclusives} />
      </StoreProvider>
      <Suspense fallback={null}><AnalyticsScripts /></Suspense>
      <Analytics />
      <JsonLd data={organizationLd()} />
    </>
  );
}
