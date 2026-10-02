import { WishlistView } from "@/components/shop/WishlistView";
import { pageMeta } from "@/lib/seo";
export const metadata = { ...pageMeta({ title: "Your wishlist", path: "/wishlist" }), robots: { index: false } };
export default function Wishlist() { return <div className="page-enter"><WishlistView /></div>; }
