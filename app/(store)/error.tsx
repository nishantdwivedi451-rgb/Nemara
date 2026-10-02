"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="wrap empty empty--page">
      <p className="hand">a small smudge in the ink —</p>
      <h1 className="h1">Something went wrong.</h1>
      <p className="muted">Please try again. If it keeps happening, message us on WhatsApp and we&apos;ll help directly.</p>
      <div className="empty__ctas"><button className="btn" onClick={reset}>Try again</button><Link href="/" className="btn btn--ghost">Home</Link></div>
    </div>
  );
}
