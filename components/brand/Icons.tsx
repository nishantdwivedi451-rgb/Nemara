import type { SVGProps } from "react";

const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type P = SVGProps<SVGSVGElement>;

export const IconSearch = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;
export const IconBag = (p: P) => <svg {...base} {...p}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6.5a3 3 0 016 0V8" /></svg>;
export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => <svg {...base} {...p} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>;
export const IconMenu = (p: P) => <svg {...base} {...p}><path d="M4 8h16M4 16h11" /></svg>;
export const IconClose = (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconCamera = (p: P) => <svg {...base} {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
export const IconSpark = (p: P) => <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /></svg>;
export const IconShop = (p: P) => <svg {...base} {...p}><path d="M4 5h16v14H4zM4 10h16M10 10v9" /></svg>;
export const IconPlus = (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconMinus = (p: P) => <svg {...base} {...p}><path d="M5 12h14" /></svg>;
export const IconArrow = (p: P) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconMail = (p: P) => <svg {...base} {...p}><path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" /></svg>;
export const IconPhone = (p: P) => <svg {...base} {...p}><path d="M6 3h3l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" /></svg>;
export const IconPin = (p: P) => <svg {...base} {...p}><path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></svg>;
export const IconInstagram = (p: P) => <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></svg>;
export const IconWhatsApp = (p: P) => (
  <svg {...base} {...p}><path d="M4 20l1.2-3.8A8 8 0 1112 20a8 8 0 01-4-1.1z" /><path d="M9 8.5c0 3.5 2.6 6.4 6 6.6l1-1.5-2-1-1 .8a4 4 0 01-2-2l.8-1-1-2z" /></svg>
);
export const IconDownload = (p: P) => <svg {...base} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
export const IconShare = (p: P) => <svg {...base} {...p}><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8.2 11l7.6-4M8.2 13l7.6 4" /></svg>;
