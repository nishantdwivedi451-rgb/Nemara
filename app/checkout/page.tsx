import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { PREVIEW_MODE, SITE } from "@/lib/site";
import { payments } from "@/lib/payments";
export const metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";
export default function Checkout() {
  const p = payments();
  return <div className="page-enter"><CheckoutForm threshold={SITE.shipping.freeShippingThreshold} flat={SITE.shipping.flatRate} demo={p.name === "demo"} preview={PREVIEW_MODE} /></div>;
}
