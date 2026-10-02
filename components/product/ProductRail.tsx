"use client";
import { useRef } from "react";
import { ProductCard, type CardProduct } from "./ProductCard";
import { IconArrow } from "@/components/brand/Icons";

export function ProductRail({ products, label }: { products: CardProduct[]; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="rail">
      <div className="rail__ctrl desktop-only">
        <button className="icon-btn" onClick={() => go(-1)} aria-label={`Scroll ${label} back`}><IconArrow style={{ transform: "scaleX(-1)" }} /></button>
        <button className="icon-btn" onClick={() => go(1)} aria-label={`Scroll ${label} forward`}><IconArrow /></button>
      </div>
      <ul className="rail__track" ref={ref} aria-label={label}>
        {products.map((p) => <li key={p.handle}><ProductCard p={p} showNote /></li>)}
      </ul>
    </div>
  );
}
