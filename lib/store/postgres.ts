import "server-only";
import { neon } from "@neondatabase/serverless";
import type { DocStore } from "./types";
import { blobStore } from "./blob";
import { fsStore } from "./fs";

// Postgres (Neon) document table. Enabled automatically when DATABASE_URL is set.
// Binary files stay in Blob (or the local filesystem in development).
let ready: Promise<unknown> | null = null;
const sql = () => neon(process.env.DATABASE_URL!);
const init = () => (ready ??= sql()`CREATE TABLE IF NOT EXISTS nemara_docs (
  col text NOT NULL, id text NOT NULL, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (col, id))`);
const files = () => (process.env.BLOB_READ_WRITE_TOKEN ? blobStore : fsStore);

export const postgresStore: DocStore = {
  name: "postgres",
  async get(c, id) {
    await init();
    const rows = await sql()`SELECT data FROM nemara_docs WHERE col = ${c} AND id = ${id}`;
    return (rows[0]?.data as never) ?? null;
  },
  async put(c, id, doc) {
    await init();
    await sql()`INSERT INTO nemara_docs (col, id, data) VALUES (${c}, ${id}, ${JSON.stringify(doc)}::jsonb)
      ON CONFLICT (col, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  },
  async del(c, id) { await init(); await sql()`DELETE FROM nemara_docs WHERE col = ${c} AND id = ${id}`; },
  async list(c, opts = {}) {
    await init();
    const limit = opts.limit ?? 50, after = opts.cursor ?? "";
    const rows = await sql()`SELECT id, data FROM nemara_docs WHERE col = ${c} AND id > ${after} ORDER BY id ASC LIMIT ${limit + 1}`;
    const page = rows.slice(0, limit);
    return { items: page.map((r) => r.data as never), cursor: rows.length > limit ? String(page[page.length - 1].id) : undefined };
  },
  putFile: (p, d, t) => files().putFile(p, d, t),
  getFile: (p) => files().getFile(p),
};
