import type { Metadata } from "next";
import { siteUrl, SITE } from "./site";
import type { Product } from "./commerce/types";

export function pageMeta({ title, description, path, image }: { title: string; description?: string; path: string; image?: string }): Metadata {
  const desc = description ?? SITE.description;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title: `${title} — Nemara`, description: desc, url: path, siteName: "Nemara", type: "website", locale: "en_IN", ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: "summary_large_image", title: `${title} — Nemara`, description: desc },
  };
}

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl()}${it.path}` })),
});

export const productLd = (p: Product, artistName?: string) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  sku: p.sku,
  description: p.description,
  image: p.images.map((i) => (i.src.startsWith("http") ? i.src : `${siteUrl()}${i.src}`)),
  brand: { "@type": "Brand", name: "Nemara" },
  material: p.material,
  category: p.category,
  ...(artistName ? { additionalProperty: [{ "@type": "PropertyValue", name: "Artisan", value: artistName }] } : {}),
  offers: {
    "@type": "Offer",
    url: `${siteUrl()}/product/${p.handle}`,
    priceCurrency: "INR",
    price: p.price,
    availability: p.availability === "sold_out" ? "https://schema.org/OutOfStock" : p.availability === "low_stock" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
  },
});

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nemara",
  url: siteUrl(),
  logo: `${siteUrl()}/icon.svg`,
  founder: { "@type": "Person", name: "Pratima Saxena" },
  description: SITE.description,
});
