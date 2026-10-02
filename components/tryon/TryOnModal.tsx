"use client";
import { useEffect } from "react";
import { TryOnStudio } from "./TryOnStudio";
import { toPiece } from "@/lib/tryon/piece";
import { IconClose } from "@/components/brand/Icons";
import type { Product } from "@/lib/commerce/types";

export function TryOnModal({ product, onClose }: { product: Product; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, [onClose]);
  return (
    <div className="tryon-modal" role="dialog" aria-modal="true" aria-label={`Try on ${product.name}`}>
      <div className="tryon-modal__head">
        <p className="eyebrow">Try this on</p>
        <button className="icon-btn" onClick={onClose} aria-label="Close try-on"><IconClose /></button>
      </div>
      <TryOnStudio pieces={[toPiece(product)]} initial={product.handle} compact />
    </div>
  );
}
