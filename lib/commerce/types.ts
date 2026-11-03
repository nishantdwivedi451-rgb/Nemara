// Nemara commerce domain model. Every provider (local JSON, Shopify, …) maps into these types,
// so the UI never knows where the catalogue comes from.

export type ImageAsset = { src: string; alt: string; role?: string; width?: number; height?: number };

/** How we found it: the market moment, plus the buyer's one-line note. */
export type StoryFind = { body: string; note?: string; sketch?: ImageAsset };
/** What the Nemara quality check covered for this piece. */
export type StoryCheck = { body: string; steps?: string[]; image?: ImageAsset };
/** Where to wear it and what to wear it with. */
export type StoryStyle = { body: string; pairWith?: string[]; image?: ImageAsset };
export type ProductStory = { find: StoryFind; check: StoryCheck; style: StoryStyle };

export type TryOnAnchor = "ears" | "neck" | "wrist";
export type TryOnConfig = {
  supported: boolean;
  anchor: TryOnAnchor;
  /** Transparent PNG/SVG of the piece used by the prototype provider. */
  overlay: string;
  scale?: number;
  /** Reference for a production AR provider (e.g. a 3D model id or GLB url). */
  arAsset?: { provider: string; ref: string } | null;
};

export type Variant = { id: string; title: string; sku: string; available: boolean; price: number };

export type Availability = "in_stock" | "low_stock" | "sold_out";

export type Product = {
  id: string;
  sku: string;
  handle: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  currency: "INR";
  inventory: number;
  availability: Availability;
  category: string;
  occasions: string[];
  collections: string[];
  tags: string[];
  material: string;
  dimensions: string;
  care: string;
  /** Slug of the market (content/markets.json) the piece was handpicked from. */
  market: string;
  featured: boolean;
  /** Members-only / Nemara Circle exclusive design. */
  exclusive?: boolean;
  createdAt: string;
  images: ImageAsset[];
  story: ProductStory;
  variants: Variant[];
  tryOn?: TryOnConfig;
  seo?: { title?: string | null; description?: string | null };
};

export type Taxon = { slug: string; name: string; line: string; label?: string; tone?: string; image?: ImageAsset };

/** One of India's jewellery markets Nemara curates from. */
export type Market = {
  slug: string;
  city: string;
  market: string;
  region: string;
  signature: string;
  image: ImageAsset;
  summary: string;
  lead: string;
  story: string[];
  lookFor: string[];
  wearIt: string;
  tip: string;
};

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export type ProductQuery = {
  category?: string;
  occasion?: string;
  collection?: string;
  market?: string;
  q?: string;
  sort?: SortKey;
  limit?: number;
};

export type CartLineInput = { handle: string; variantId?: string; quantity: number };

export interface CommerceProvider {
  readonly name: string;
  getProducts(query?: ProductQuery): Promise<Product[]>;
  getProduct(handle: string): Promise<Product | null>;
  getCategories(): Promise<Taxon[]>;
  getOccasions(): Promise<Taxon[]>;
  getCollections(): Promise<Taxon[]>;
  /** Providers with hosted checkout (e.g. Shopify) return a redirect URL. */
  createHostedCheckout?(lines: CartLineInput[]): Promise<{ url: string }>;
}
