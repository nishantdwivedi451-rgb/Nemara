import Link from "next/link";
import { Wordmark, Mark, Lockup } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SITE, contact, whatsappUrl } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__sign">
            <Lockup className="footer__lockup" tagline />
            <p className="display footer__claim">Wear your<br /><em>story.</em></p>
          </div>
          <div className="footer__news">
            <p className="eyebrow">The Nemara Letter</p>
            <p className="footer__news-copy">New market edits, styling notes and first look at every drop. Once a month, never more.</p>
            <NewsletterForm dark />
          </div>
        </div>
        <div className="footer__cols">
          <nav aria-label="Shop"><p className="eyebrow">Shop</p><ul>
            <li><Link href="/shop">All pieces</Link></li><li><Link href="/shop/earrings">Earrings</Link></li><li><Link href="/shop/necklace-sets">Necklace Sets</Link></li>
            <li><Link href="/shop/bracelets">Bracelets</Link></li><li><Link href="/shop/kada">Kada</Link></li><li><Link href="/shop/giftable">Gifts</Link></li></ul></nav>
          <nav aria-label="Nemara"><p className="eyebrow">Nemara</p><ul>
            <li><Link href="/our-story">Our Story</Link></li><li><Link href="/markets">Markets</Link></li><li><Link href="/try-on">Try It On</Link></li>
            <li><Link href="/stylist">Nemara Stylist</Link></li><li><Link href="/journal">Journal</Link></li><li><Link href="/contact">Contact</Link></li></ul></nav>
          <nav aria-label="Help"><p className="eyebrow">Help</p><ul>
            <li><Link href="/info/shipping">Shipping &amp; Delivery</Link></li><li><Link href="/info/returns">Refund &amp; Cancellation</Link></li><li><Link href="/info/warranty">3-month warranty</Link></li><li><Link href="/info/care">Jewellery care</Link></li>
            <li><Link href="/info/terms">Terms &amp; Conditions</Link></li><li><Link href="/info/privacy">Privacy Policy</Link></li></ul></nav>
          <div><p className="eyebrow">Talk to us</p><ul>
            <li><a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li></ul></div>
        </div>
        <div className="footer__base">
          <Wordmark className="footer__wordmark" />
          <div className="footer__legal">
            <Mark className="footer__mark" />
            <span>© {year} {SITE.legal.business}. Nemara is a brand of {SITE.legal.business}. {contact.address}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
