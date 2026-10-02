"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Logo";
import { IconBag, IconClose, IconHeart, IconMenu, IconSearch, IconUser } from "@/components/brand/Icons";
import { useStore } from "./StoreProvider";
import type { Taxon } from "@/lib/commerce/types";

export type NavData = { categories: Taxon[]; occasions: Taxon[]; collections: Taxon[] };

export function Header({ nav }: { nav: NavData }) {
  const pathname = usePathname();
  const { count, wishlist, setCartOpen, setSearchOpen, customer, accountsAvailable, openAuth } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setMega(false); setDrawer(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMega(false); setDrawer(false); } };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [drawer]);

  const openMega = () => { window.clearTimeout(closeTimer.current); setMega(true); };
  const closeMega = () => { closeTimer.current = window.setTimeout(() => setMega(false), 140); };
  const active = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "is-active" : undefined);

  return (
    <header className={`site-header ${scrolled || mega ? "is-solid" : ""}`}>
      <div className="site-header__bar wrap">
        <nav className="site-header__left" aria-label="Primary">
          <button className="icon-btn mobile-only" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}><IconMenu /></button>
          <div className="desktop-only nav-links">
            <div onMouseEnter={openMega} onMouseLeave={closeMega}>
              <Link href="/shop" className={active("/shop")} aria-expanded={mega} aria-haspopup="true" onFocus={openMega}>Shop</Link>
            </div>
            <Link href="/our-story" className={active("/our-story")}>Our Story</Link>
            <Link href="/artists" className={active("/artists")}>Artists</Link>
          </div>
        </nav>

        <Link href="/" className="site-header__logo" aria-label="Nemara — home">
          <Wordmark />
        </Link>

        <div className="site-header__right">
          <div className="desktop-only nav-links">
            <Link href="/try-on" className={active("/try-on")}>Try It On</Link>
            <Link href="/journal" className={active("/journal")}>Journal</Link>
            <Link href="/contact" className={active("/contact")}>Contact</Link>
          </div>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search"><IconSearch /></button>
          {accountsAvailable && (customer
            ? <Link href="/account" className="icon-btn desktop-only" aria-label={`Your account, ${customer.name}`} title={customer.name}><IconUser /><span className="acct-dot" /></Link>
            : <button className="icon-btn desktop-only" onClick={() => openAuth("account")} aria-label="Sign in"><IconUser /></button>)}
          <Link href="/wishlist" className="icon-btn desktop-only" aria-label={`Wishlist, ${wishlist.length} saved`}>
            <IconHeart />{wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </Link>
          <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label={`Bag, ${count} items`}>
            <IconBag />{count > 0 && <span className="badge">{count}</span>}
          </button>
        </div>
      </div>

      {/* Shop mega-menu */}
      <div className={`mega ${mega ? "is-open" : ""}`} onMouseEnter={openMega} onMouseLeave={closeMega} aria-hidden={!mega}>
        <div className="wrap mega__inner">
          <div>
            <p className="eyebrow">Categories</p>
            <ul>{nav.categories.map((c) => <li key={c.slug}><Link tabIndex={mega ? 0 : -1} href={`/shop/${c.slug}`}>{c.name}</Link></li>)}</ul>
          </div>
          <div>
            <p className="eyebrow">Choose your moment</p>
            <ul>{nav.occasions.map((c) => <li key={c.slug}><Link tabIndex={mega ? 0 : -1} href={`/shop/${c.slug}`}>{c.name}</Link></li>)}</ul>
          </div>
          <div>
            <p className="eyebrow">Edits</p>
            <ul className="mega__small">{nav.collections.map((c) => <li key={c.slug}><Link tabIndex={mega ? 0 : -1} href={`/shop/${c.slug}`}>{c.name}</Link></li>)}</ul>
          </div>
          <Link href="/try-on" className="mega__feature" tabIndex={mega ? 0 : -1}>
            <div className="frame ratio-45"><Image src="/art/campaign/after-hours.svg" alt="" fill sizes="240px" unoptimized /></div>
            <span className="eyebrow">Try it on, live</span>
            <span className="mega__feature-line">See any piece on you before you buy.</span>
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`drawer-scrim ${drawer ? "is-open" : ""}`} onClick={() => setDrawer(false)} />
      <aside className={`nav-drawer ${drawer ? "is-open" : ""}`} aria-label="Menu" aria-hidden={!drawer}>
        <div className="nav-drawer__top">
          <Wordmark className="nav-drawer__logo" />
          <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu"><IconClose /></button>
        </div>
        <ul className="nav-drawer__primary">
          {[["Shop", "/shop"], ["Our Story", "/our-story"], ["Artists", "/artists"], ["Try It On", "/try-on"], ["Nemara Stylist", "/stylist"], ["Journal", "/journal"], ["My account", "/account"], ["Contact", "/contact"]].map(([l, h], i) => (
            <li key={h} style={{ ["--i" as string]: i }}><Link href={h} tabIndex={drawer ? 0 : -1}>{l}</Link></li>
          ))}
        </ul>
        <div className="nav-drawer__secondary">
          <p className="eyebrow">Shop by category</p>
          <div className="chips">{nav.categories.map((c) => <Link key={c.slug} className="chip" href={`/shop/${c.slug}`} tabIndex={drawer ? 0 : -1}>{c.name}</Link>)}</div>
          <p className="eyebrow">Choose your moment</p>
          <div className="chips">{nav.occasions.map((c) => <Link key={c.slug} className="chip" href={`/shop/${c.slug}`} tabIndex={drawer ? 0 : -1}>{c.name}</Link>)}</div>
        </div>
      </aside>
    </header>
  );
}
