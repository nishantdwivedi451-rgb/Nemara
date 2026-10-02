"use client";
import { IconWhatsApp } from "@/components/brand/Icons";
import { track } from "@/lib/analytics";

export function WhatsAppButton({ href }: { href: string }) {
  return (
    <a className="wa-float" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Nemara on WhatsApp"
       onClick={() => track("whatsapp_click", { placement: "floating" })}>
      <IconWhatsApp /><span>Ask Nemara</span>
    </a>
  );
}
