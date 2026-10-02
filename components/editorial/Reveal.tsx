"use client";
import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";

/** Adds `.is-in` when the element scrolls into view — drives CSS-only reveal animations. */
export function Reveal({ as: Tag = "div", className = "reveal", delay = 0, children, style, ...rest }:
  { as?: ElementType; className?: string; delay?: number; children: ReactNode; style?: CSSProperties } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-in"); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={className} style={{ ...style, ["--d" as string]: `${delay}ms` }} {...rest}>{children}</Tag>;
}

/** Splits a headline into masked lines that rise in sequence. */
export function Lines({ lines, as: Tag = "h2", className = "" }: { lines: ReactNode[]; as?: ElementType; className?: string }) {
  return (
    <Reveal as={Tag} className={`lines ${className}`}>
      {lines.map((l, i) => <span key={i} style={{ ["--i" as string]: i }}><span>{l}</span></span>)}
    </Reveal>
  );
}
