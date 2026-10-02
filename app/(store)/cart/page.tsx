import { CartView } from "@/components/cart/CartView";
import { SITE } from "@/lib/site";
export const metadata = { title: "Your bag", robots: { index: false } };
export default function CartPage() { return <div className="page-enter"><CartView threshold={SITE.shipping.freeShippingThreshold} flat={SITE.shipping.flatRate} /></div>; }
