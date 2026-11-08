"use client";
import { useEffect } from "react";

/** Product photography is Nemara's own: no right-click "Save image", no drag-out, no long-press save. */
const PROTECTED = 'img[src*="/products/"], .frame img';

export function ImageGuard() {
  useEffect(() => {
    const block = (e: Event) => { if ((e.target as Element)?.closest?.(".frame") || (e.target as Element)?.matches?.(PROTECTED)) e.preventDefault(); };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => { document.removeEventListener("contextmenu", block); document.removeEventListener("dragstart", block); };
  }, []);
  return null;
}
