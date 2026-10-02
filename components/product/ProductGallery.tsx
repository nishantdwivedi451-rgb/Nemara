"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconClose } from "@/components/brand/Icons";
import type { ImageAsset } from "@/lib/commerce/types";

const LABEL: Record<string, string> = { hero: "The piece", worn: "As worn", detail: "Up close", story: "The sketch" };

export function ProductGallery({ images, name }: { images: ImageAsset[]; name: string }) {
  const [zoom, setZoom] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (zoom === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowRight") setZoom((z) => (z === null ? z : (z + 1) % images.length));
      if (e.key === "ArrowLeft") setZoom((z) => (z === null ? z : (z - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [zoom, images.length]);

  return (
    <div className="gallery">
      <ul className="gallery__track" ref={track} aria-label={`${name} images`}>
        {images.map((im, i) => (
          <li key={im.src + i} className={`gallery__item gallery__item--${i}`}>
            <button className="frame ratio-45 gallery__btn" onClick={() => setZoom(i)} aria-label={`Enlarge: ${im.alt}`}>
              <Image src={im.src} alt={im.alt} fill priority={i === 0} sizes="(min-width: 900px) 30vw, 100vw" unoptimized />
            </button>
            {im.role && LABEL[im.role] && <span className="gallery__label hand">{LABEL[im.role]}</span>}
          </li>
        ))}
      </ul>
      <div className="gallery__dots mobile-only" aria-hidden="true">
        {images.map((_, i) => <span key={i} className={i === active ? "is-on" : ""} />)}
      </div>
      {zoom !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={images[zoom].alt} onClick={() => setZoom(null)}>
          <button className="icon-btn lightbox__close" onClick={() => setZoom(null)} aria-label="Close"><IconClose /></button>
          <div className="lightbox__img" onClick={(e) => e.stopPropagation()}>
            <Image src={images[zoom].src} alt={images[zoom].alt} fill sizes="100vw" unoptimized />
          </div>
          <p className="lightbox__cap">{zoom + 1} / {images.length} — {images[zoom].alt}</p>
        </div>
      )}
    </div>
  );
}
