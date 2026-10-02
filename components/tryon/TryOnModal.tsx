"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TryOnStudio } from "./TryOnStudio";
import { toPiece } from "@/lib/tryon/piece";
import type { Product } from "@/lib/commerce/types";

export function TryOnModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div className="tryon-modal" role="dialog" aria-modal="true" aria-label={`Try on ${product.name}`}>
      <TryOnStudio pieces={[toPiece(product)]} initial={product.handle} variant="modal" onClose={onClose} />
    </div>,
    document.body,
  );
}
