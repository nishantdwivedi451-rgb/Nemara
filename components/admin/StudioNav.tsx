"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["Overview", "/admin"], ["Orders", "/admin/orders"], ["Products", "/admin/products"], ["Inventory", "/admin/inventory"],
  ["Customers", "/admin/customers"], ["Visitors", "/admin/visitors"], ["Marketing", "/admin/marketing"],
] as const;

export function StudioNav() {
  const p = usePathname();
  return (
    <nav className="a-nav" aria-label="Studio">
      {NAV.map(([label, href]) => {
        const on = href === "/admin" ? p === "/admin" : p.startsWith(href);
        return <Link key={href} href={href} className={on ? "is-on" : undefined} aria-current={on ? "page" : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
