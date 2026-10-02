"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBag, IconCamera, IconHeart, IconShop, IconUser } from "@/components/brand/Icons";
import { useStore } from "./StoreProvider";

export function MobileTabBar() {
  const p = usePathname();
  const { count, wishlist, setCartOpen, customer } = useStore();
  const on = (h: string) => (p === h || p.startsWith(h + "/") ? "is-active" : undefined);
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      <Link href="/shop" className={on("/shop")}><IconShop /><span>Shop</span></Link>
      <Link href="/try-on" className={on("/try-on")}><IconCamera /><span>Try On</span></Link>
      <Link href="/wishlist" className={on("/wishlist")}><IconHeart /><span>Saved</span>{wishlist.length > 0 && <i className="badge">{wishlist.length}</i>}</Link>
      <Link href="/account" className={on("/account")}><IconUser /><span>{customer ? "Account" : "Sign in"}</span></Link>
      <button onClick={() => setCartOpen(true)}><IconBag /><span>Bag</span>{count > 0 && <i className="badge">{count}</i>}</button>
    </nav>
  );
}
