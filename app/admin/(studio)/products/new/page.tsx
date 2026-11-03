import { ProductForm } from "@/components/admin/ProductForm";
import { PageHead } from "@/components/admin/ui";
import taxonomy from "@/content/taxonomy.json";
import markets from "@/content/markets.json";

export const metadata = { title: "Add a design" };
export default function NewProduct() {
  return (<><PageHead title="Add a design" sub="New pieces go live on the storefront the moment you publish." /><ProductForm taxonomy={taxonomy} markets={markets.map((m) => ({ slug: m.slug, name: `${m.city} — ${m.market}` }))} /></>);
}
