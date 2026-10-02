import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { StudioNav } from "@/components/admin/StudioNav";
import { requireAdmin } from "@/lib/admin/auth";
import { logout } from "@/app/admin/actions";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();
  const backend = store().name;
  return (
    <div className="a-shell">
      <aside className="a-side">
        <Link href="/admin" className="a-brand" aria-label="Nemara Studio home"><Wordmark className="a-brand__mark" /><span>Studio</span></Link>
        <StudioNav />
        <div className="a-side__foot">
          <a href="/" target="_blank" rel="noopener noreferrer" className="a-side__link">View storefront ↗</a>
          <span className="a-side__who" title={email}>{email}</span>
          <span className="a-side__db">Data: {backend === "postgres" ? "Postgres" : backend === "blob" ? "Vercel Blob (private)" : "Local files"}</span>
          <form action={logout}><button className="a-side__link">Sign out</button></form>
        </div>
      </aside>
      <div className="a-main">
        {process.env.VERCEL && backend === "fs" && (
          <div className="a-alert">
            <b>Connect storage to switch Studio on.</b> Until then you&apos;re seeing the built-in catalogue; edits, orders, sign-ups and visitor tracking won&apos;t be saved, and the Circle popup stays hidden.
            <br />Vercel → project <b>nemara</b> → <b>Storage</b> → <b>Create</b> → <b>Blob</b> → access <b>Private</b>, region <b>Mumbai (bom1)</b> → Connect to all environments → then redeploy.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
