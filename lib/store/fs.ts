import "server-only";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { DocStore } from "./types";

// Local development backend: JSON files under .data/ (git-ignored).
const ROOT = join(process.cwd(), ".data");
const file = (c: string, id: string) => join(ROOT, "data", c, `${id}.json`);
const MIME: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml", gif: "image/gif" };

export const fsStore: DocStore = {
  name: "fs",
  async get(c, id) { try { return JSON.parse(await readFile(file(c, id), "utf8")); } catch { return null; } },
  async put(c, id, doc) { const f = file(c, id); await mkdir(dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(doc, null, 2)); },
  async del(c, id) { await rm(file(c, id), { force: true }); },
  async list(c, opts = {}) {
    let names: string[] = [];
    try { names = (await readdir(join(ROOT, "data", c))).filter((n) => n.endsWith(".json")).sort(); } catch { /* empty */ }
    const start = opts.cursor ? names.indexOf(opts.cursor) + 1 : 0, limit = opts.limit ?? 50;
    const page = names.slice(start, start + limit);
    const items = await Promise.all(page.map(async (n) => JSON.parse(await readFile(join(ROOT, "data", c, n), "utf8"))));
    return { items, cursor: start + limit < names.length ? page[page.length - 1] : undefined };
  },
  async putFile(p, data) { const f = join(ROOT, "media", p); await mkdir(dirname(f), { recursive: true }); await writeFile(f, Buffer.from(data)); return `/media/${p}`; },
  async getFile(p) {
    try { const buf = await readFile(join(ROOT, "media", p)); return { body: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: MIME[p.split(".").pop() ?? ""] ?? "application/octet-stream" }; }
    catch { return null; }
  },
};
