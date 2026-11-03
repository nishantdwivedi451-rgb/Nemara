import type { Metadata } from "next";
import { PaymentReturn } from "@/components/cart/PaymentReturn";

export const metadata: Metadata = { title: "Confirming your payment", robots: { index: false } };

export default function ReturnPage() {
  return <div className="page-enter"><PaymentReturn /></div>;
}
