import { OrderSuccess } from "@/components/cart/OrderSuccess";
export const metadata = { title: "Thank you", robots: { index: false } };
export default function Success() { return <div className="page-enter"><OrderSuccess /></div>; }
