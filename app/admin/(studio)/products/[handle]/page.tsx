import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHead } from "@/components/admin/ui";
import { loadCatalogueFresh } from "@/lib/catalogue";
import { deleteProduct } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import taxonomy from "@/content/taxonomy.json";
import artists from "@/content/artists.json";

export default async function EditProduct({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = (await loadCatalogueFresh()).find((x) => x.handle === handle);
  if (!p) notFound();
  return (
    <>
      <PageHead title={p.name} sub={`${p.sku} · ${p.status === "draft" ? "Draft" : "Live on the storefront"}`} actions={<a className="a-btn" href={`/product/${p.handle}`} target="_blank" rel="noopener noreferrer">View live ↗</a>} />
      <ProductForm initial={p} taxonomy={taxonomy} artists={artists.map((a) => ({ slug: a.slug, name: a.name }))} />
      <form action={deleteProduct.bind(null, p.handle)} className="a-danger">
        <div><b>Delete this design</b><p>Removes it from the storefront and Studio. Past orders keep their record.</p></div>
        <ConfirmButton className="a-btn a-btn--danger" message={`Delete ${p.name}? This cannot be undone.`}>Delete design</ConfirmButton>
      </form>
    </>
  );
}
