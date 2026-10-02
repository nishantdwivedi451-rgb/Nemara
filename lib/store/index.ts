import "server-only";
import type { DocStore } from "./types";
import { blobStore } from "./blob";
import { postgresStore } from "./postgres";
import { fsStore } from "./fs";

/** Postgres when DATABASE_URL is set, else private Vercel Blob, else local files (dev). */
export function store(): DocStore {
  if (process.env.DATABASE_URL) return postgresStore;
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobStore;
  if (process.env.VERCEL) console.warn("[store] no DATABASE_URL or BLOB_READ_WRITE_TOKEN on Vercel — data will not persist");
  return fsStore;
}
export const storeConfigured = () => !!(process.env.DATABASE_URL || process.env.BLOB_READ_WRITE_TOKEN || !process.env.VERCEL);
export * from "./types";
