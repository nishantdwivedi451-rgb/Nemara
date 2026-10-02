"use client";
import { useEffect, useState } from "react";

const VERSIONS = ["bold", "quiet", "ambitious", "playful", "celebrating", "off-duty", "different by Thursday"];

export function VersionTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % VERSIONS.length), 2200);
    return () => window.clearInterval(t);
  }, []);
  return (
    <p className="ticker" aria-live="off">
      <span className="muted">Today, she is </span>
      <span className="ticker__word" key={i}><span className="hand">{VERSIONS[i]}.</span></span>
    </p>
  );
}
