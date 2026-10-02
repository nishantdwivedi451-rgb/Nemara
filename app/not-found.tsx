import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap empty empty--page notfound">
      <p className="hand">this page wandered off —</p>
      <h1 className="display">Lost the<br /><em>thread.</em></h1>
      <p className="muted">The page you were looking for isn&apos;t here. The stories are.</p>
      <div className="empty__ctas"><Link href="/" className="btn">Back to Nemara</Link><Link href="/shop" className="btn btn--ghost">Explore the edition</Link></div>
    </div>
  );
}
