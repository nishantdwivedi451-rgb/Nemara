import "server-only";
import { del, get, list, put } from "@vercel/blob";
import type { DocStore } from "./types";

// Private Vercel Blob store: customer data is never publicly addressable.
const ACCESS = "private" as const;
const path = (c: string, id: string) => `data/${c}/${id}.json`;

async function readJson<T>(pathname: string): Promise<T | null> {
  const r = await get(pathname, { access: ACCESS, useCache: false }).catch(() => null);
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  return (await new Response(r.stream).json()) as T;
}

export const blobStore: DocStore = {
  name: "blob",
  async get(c, id) { return readJson(path(c, id)); },
  async put(c, id, doc) {
    await put(path(c, id), JSON.stringify(doc), { access: ACCESS, contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
  },
  async del(c, id) {
    const { blobs } = await list({ prefix: path(c, id), limit: 1 });
    if (blobs[0]) await del(blobs[0].url);
  },
  async list(c, opts = {}) {
    const res = await list({ prefix: `data/${c}/`, limit: opts.limit ?? 50, cursor: opts.cursor });
    const items = await Promise.all(res.blobs.map((b) => readJson(b.pathname)));
    return { items: items.filter(Boolean) as never[], cursor: res.hasMore ? res.cursor : undefined };
  },
  async putFile(p, data, contentType) {
    await put(`media/${p}`, new Blob([data], { type: contentType }), { access: ACCESS, contentType, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 });
    return `/media/${p}`;
  },
  async getFile(p) {
    const r = await get(`media/${p}`, { access: ACCESS }).catch(() => null);
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    return { body: r.stream, contentType: r.blob.contentType };
  },
};
