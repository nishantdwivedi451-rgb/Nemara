import "server-only";
import type { CommerceProvider } from "./types";
import { localProvider } from "./providers/local";
import { shopifyProvider } from "./providers/shopify";

/** Select the catalogue backend with COMMERCE_PROVIDER (local | shopify). */
export const commerce: CommerceProvider = process.env.COMMERCE_PROVIDER === "shopify" ? shopifyProvider : localProvider;

export * from "./types";
