import { ProductForm } from "@/components/admin/ProductForm";
import { PageHead } from "@/components/admin/ui";
import taxonomy from "@/content/taxonomy.json";
import artists from "@/content/artists.json";

export const metadata = { title: "Add a design" };
export default function NewProduct() {
  return (<><PageHead title="Add a design" sub="New pieces go live on the storefront the moment you publish." /><ProductForm taxonomy={taxonomy} artists={artists.map((a) => ({ slug: a.slug, name: a.name }))} /></>);
}
