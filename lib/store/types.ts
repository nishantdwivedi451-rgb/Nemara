/**
 * Nemara document store — the persistence contract behind the storefront catalogue,
 * orders, inventory, customers and marketing data.
 *
 * Collections hold JSON documents addressed by id. Ids that start with `newestId()`
 * sort newest-first, so `list()` returns recent records without a secondary index.
 */
export type ListResult<T> = { items: T[]; cursor?: string };

export interface DocStore {
  readonly name: "blob" | "postgres" | "fs";
  get<T>(collection: string, id: string): Promise<T | null>;
  put<T>(collection: string, id: string, doc: T): Promise<void>;
  del(collection: string, id: string): Promise<void>;
  /** Newest-first when ids come from `newestId()`. */
  list<T>(collection: string, opts?: { limit?: number; cursor?: string }): Promise<ListResult<T>>;
  /** Binary assets (product images, try-on overlays). Returns the public path, served via /media. */
  putFile(path: string, data: ArrayBuffer, contentType: string): Promise<string>;
  getFile(path: string): Promise<{ body: ReadableStream | ArrayBuffer; contentType: string } | null>;
}

const MAX = 9_999_999_999_999;
/** Sortable id: newer records sort first lexicographically. */
export function newestId(suffix = ""): string {
  const inv = String(MAX - Date.now()).padStart(13, "0");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${inv}_${rand}${suffix ? `_${suffix}` : ""}`;
}
export const safeId = (s: string) => s.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 120);
