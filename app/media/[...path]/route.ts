import { store } from "@/lib/store";

/** Serves images uploaded in Nemara Studio from the private store, cached at the edge. */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const p = (await params).path.join("/");
  if (p.includes("..") || !/^[a-z0-9/_.-]+$/i.test(p)) return new Response("Not found", { status: 404 });
  const file = await store().getFile(p);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.body as BodyInit, { headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
