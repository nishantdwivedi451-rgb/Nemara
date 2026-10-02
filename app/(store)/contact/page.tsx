import { ContactForm } from "@/components/forms/ContactForm";
import { IconInstagram, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/brand/Icons";
import { contact, whatsappUrl } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Talk to Nemara", description: "Questions about a piece, an order or a gift? Talk to Nemara on WhatsApp, phone, email or Instagram.", path: "/contact" });

export default function Contact() {
  const rows = [
    { icon: <IconWhatsApp />, k: "WhatsApp", v: "Fastest — a real person replies", href: whatsappUrl(), ext: true },
    { icon: <IconPhone />, k: "Phone", v: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    { icon: <IconMail />, k: "Email", v: contact.email, href: `mailto:${contact.email}` },
    { icon: <IconInstagram />, k: "Instagram", v: `@${contact.instagram}`, href: `https://instagram.com/${contact.instagram}`, ext: true },
    { icon: <IconPin />, k: "Studio", v: contact.address },
  ];
  return (
    <div className="page-enter">
      <header className="wrap page-head">
        <p className="eyebrow">Contact</p>
        <h1 className="display">Talk to<br /><em>Nemara.</em></h1>
        <p className="lede">Help choosing, a question about an order, a gift for someone hard to buy for — write to us. {contact.hours}.</p>
      </header>
      <div className="wrap contact">
        <ul className="contact__list">
          {rows.map((r) => (
            <li key={r.k}>
              {r.href ? <a href={r.href} {...(r.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="contact__row">{r.icon}<span className="eyebrow">{r.k}</span><span>{r.v}</span></a>
                : <div className="contact__row">{r.icon}<span className="eyebrow">{r.k}</span><span>{r.v}</span></div>}
            </li>
          ))}
        </ul>
        <div className="contact__form"><h2 className="h3">Or leave a note</h2><ContactForm /></div>
      </div>
    </div>
  );
}
