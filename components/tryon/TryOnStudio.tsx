"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getTryOnProvider, type Pose, type Tracker } from "@/lib/tryon";
import { IconCamera, IconDownload, IconShare } from "@/components/brand/Icons";
import { useStore } from "@/components/layout/StoreProvider";
import { track } from "@/lib/analytics";
import { formatPrice, cx } from "@/lib/format";
import type { TryOnAnchor } from "@/lib/commerce/types";

import type { TryOnPiece } from "@/lib/tryon/piece";

type Status = "idle" | "starting" | "live" | "photo" | "denied" | "unsupported" | "error";

// overlay geometry per anchor: where the piece "attaches" inside its overlay image, and size factor
const GEO: Record<TryOnAnchor, { ax: number; ay: number; k: number; aspect: number }> = {
  ears: { ax: 0.5, ay: 0.1, k: 0.62, aspect: 1 },
  neck: { ax: 0.5, ay: 0.725, k: 1.05, aspect: 1 },
  wrist: { ax: 0.5, ay: 0.5, k: 1.25, aspect: 0.5 },
};
const MANUAL_DEFAULT: Record<TryOnAnchor, { x: number; y: number; s: number }> = {
  ears: { x: 0.36, y: 0.5, s: 0.16 }, neck: { x: 0.5, y: 0.78, s: 0.45 }, wrist: { x: 0.5, y: 0.6, s: 0.35 },
};

export function TryOnStudio({ pieces, initial, compact = false }: { pieces: TryOnPiece[]; initial?: string; compact?: boolean }) {
  const provider = getTryOnProvider();
  const { add } = useStore();
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [piece, setPiece] = useState<TryOnPiece>(() => pieces.find((p) => p.handle === initial) ?? pieces[0]);
  const [tracking, setTracking] = useState<"searching" | "locked" | "manual">("searching");
  const [manual, setManual] = useState(MANUAL_DEFAULT[piece.anchor]);
  const [shot, setShot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackers = useRef<Partial<Record<TryOnAnchor, Tracker | "failed">>>({});
  const overlays = useRef<Record<string, HTMLImageElement>>({});
  const smooth = useRef<Pose | null>(null);
  const lastSeen = useRef(0);
  const raf = useRef(0);
  const liveSince = useRef(0);
  const pieceRef = useRef(piece); pieceRef.current = piece;
  const manualRef = useRef(manual); manualRef.current = manual;
  const trackingRef = useRef(tracking); trackingRef.current = tracking;

  const overlayFor = (src: string) => {
    if (!overlays.current[src]) { const im = new window.Image(); im.src = src; overlays.current[src] = im; }
    return overlays.current[src];
  };

  const ensureTracker = useCallback(async (anchor: TryOnAnchor) => {
    if (trackers.current[anchor] || !provider.createTracker) return;
    try { trackers.current[anchor] = await provider.createTracker(anchor); }
    catch (e) { console.warn("[try-on] tracker unavailable, using manual placement", e); trackers.current[anchor] = "failed"; setTracking("manual"); }
  }, [provider]);

  const draw = useCallback(() => {
    const cv = canvasRef.current, ctx = cv?.getContext("2d");
    const src: HTMLVideoElement | HTMLImageElement | null = videoRef.current?.srcObject ? videoRef.current : imgRef.current;
    if (!cv || !ctx || !src) return;
    const vw = "videoWidth" in src ? src.videoWidth : src.naturalWidth, vh = "videoHeight" in src ? src.videoHeight : src.naturalHeight;
    if (!vw || !vh) { raf.current = requestAnimationFrame(draw); return; }
    if (cv.width !== vw) { cv.width = vw; cv.height = vh; }
    const p = pieceRef.current, g = GEO[p.anchor];
    const mirror = "videoWidth" in src;
    ctx.save();
    if (mirror) { ctx.translate(vw, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, 0, 0, vw, vh);

    const tr = trackers.current[p.anchor];
    let pose: Pose | null = null;
    if (tr && tr !== "failed" && trackingRef.current !== "manual") {
      try { pose = tr.detect(src, performance.now()); } catch { pose = null; }
      if (pose) {
        lastSeen.current = performance.now();
        // exponential smoothing for a calm, premium feel
        const prev = smooth.current;
        smooth.current = prev && prev.points.length === pose.points.length
          ? { points: pose.points.map((q, i) => ({ ...q, x: prev.points[i].x + (q.x - prev.points[i].x) * 0.45, y: prev.points[i].y + (q.y - prev.points[i].y) * 0.45, scale: prev.points[i].scale + (q.scale - prev.points[i].scale) * 0.3, angle: prev.points[i].angle + (q.angle - prev.points[i].angle) * 0.3 })) }
          : pose;
        if (trackingRef.current !== "locked") setTracking("locked");
      } else if (performance.now() - lastSeen.current > 600) {
        smooth.current = null;
        if (trackingRef.current === "locked") setTracking("searching");
      }
    }

    const ov = overlayFor(p.overlay);
    if (ov.complete && ov.naturalWidth) {
      const pts = smooth.current?.points ?? (trackingRef.current === "manual" || !tr || tr === "failed" || !mirror
        ? [{ x: mirror ? 1 - manualRef.current.x : manualRef.current.x, y: manualRef.current.y, scale: manualRef.current.s / g.k, angle: 0, visible: true }]
        : []);
      for (const pt of pts) {
        if (!pt.visible) continue;
        const w = pt.scale * vh * g.k * (p.scale ?? 1), h = w * g.aspect;
        ctx.save();
        ctx.translate(pt.x * vw, pt.y * vh);
        ctx.rotate(pt.angle);
        ctx.drawImage(ov, -w * g.ax, -h * g.ay, w, h);
        ctx.restore();
      }
    }
    ctx.restore();
    if ("videoWidth" in src) raf.current = requestAnimationFrame(draw);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = async () => {
    setMsg(""); setShot(null);
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("unsupported"); return; }
    setStatus("starting");
    track("try_on_started", { item_id: piece.handle, anchor: piece.anchor, mode: "camera", provider: provider.id });
    try {
      const facingMode = piece.anchor === "wrist" ? "environment" : "user";
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      imgRef.current = null;
      setStatus("live"); setTracking("searching"); liveSince.current = Date.now();
      ensureTracker(piece.anchor);
      raf.current = requestAnimationFrame(draw);
    } catch (e) {
      const name = (e as DOMException).name;
      setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      setMsg(name === "NotFoundError" ? "We couldn't find a camera on this device." : "");
    }
  };

  const usePhoto = (file: File) => {
    stop();
    const url = URL.createObjectURL(file);
    const im = new window.Image();
    im.onload = async () => {
      imgRef.current = im;
      setStatus("photo"); setTracking("searching"); setShot(null);
      track("try_on_started", { item_id: piece.handle, anchor: piece.anchor, mode: "photo", provider: provider.id });
      await ensureTracker(piece.anchor);
      smooth.current = null;
      const tr = trackers.current[pieceRef.current.anchor];
      if (tr && tr !== "failed") {
        // photos: try to auto-place once, fall back to manual
        try {
          const pose = tr.detect(im, performance.now());
          if (pose) { smooth.current = pose; setTracking("locked"); } else setTracking("manual");
        } catch { setTracking("manual"); }
      } else setTracking("manual");
      requestAnimationFrame(draw);
    };
    im.src = url;
  };

  // switching pieces may need a different tracker (face ↔ hand)
  useEffect(() => {
    setManual(MANUAL_DEFAULT[piece.anchor]);
    smooth.current = null;
    overlayFor(piece.overlay);
    if (status === "live" || status === "photo") {
      ensureTracker(piece.anchor).then(() => { if (status === "photo") requestAnimationFrame(draw); });
      if (trackingRef.current !== "manual") setTracking("searching");
    }
  }, [piece]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (status === "photo") requestAnimationFrame(draw); }, [manual, status, draw]);

  useEffect(() => () => {
    stop();
    if (liveSince.current && Date.now() - liveSince.current > 5000) track("try_on_completed", { item_id: pieceRef.current.handle, reason: "session" });
    Object.values(trackers.current).forEach((t) => t && t !== "failed" && t.close());
  }, [stop]);

  const snapshot = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    setShot(cv.toDataURL("image/jpeg", 0.92));
    track("try_on_completed", { item_id: piece.handle, reason: "snapshot" });
  };
  const share = async () => {
    if (!shot) return;
    const blob = await (await fetch(shot)).blob();
    const file = new File([blob], `nemara-${piece.handle}.jpg`, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Me in ${piece.name} — Nemara`, text: "Trying on Nemara. Wear your story." }); } catch { /* cancelled */ }
    } else {
      const a = document.createElement("a"); a.href = shot; a.download = file.name; a.click();
    }
  };

  // manual drag on the stage
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tracking !== "manual" && status !== "photo") return;
    if (status === "photo" && tracking === "locked") setTracking("manual");
    const r = (canvasRef.current ?? e.currentTarget).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (e.type === "pointerdown") { drag.current = { x, y }; e.currentTarget.setPointerCapture(e.pointerId); }
    if (e.type === "pointermove" && drag.current) setManual((m) => ({ ...m, x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }));
    if (e.type === "pointerup") drag.current = null;
  };

  const live = status === "live" || status === "photo";
  return (
    <div className={cx("studio", compact && "studio--compact")}>
      <div className="studio__stage" onPointerDown={onPointer} onPointerMove={onPointer} onPointerUp={onPointer}>
        <video ref={videoRef} playsInline muted className="studio__video" aria-hidden="true" />
        <canvas ref={canvasRef} className={cx("studio__canvas", live && "is-on")} aria-label={`Live try-on preview of ${piece.name}`} />
        {!live && (
          <div className="studio__intro">
            <div className="studio__ghost arch"><Image src={piece.image} alt="" fill sizes="300px" unoptimized /></div>
            {status === "idle" || status === "starting" ? (
              <>
                <p className="hand">see it on you —</p>
                <h3 className="h2">The Nemara mirror</h3>
                <p className="muted">Allow camera access to try <strong>{piece.name}</strong> live. Tracking runs entirely on your device; no image is uploaded or stored.</p>
                <button className="btn" onClick={startCamera} disabled={status === "starting"}><IconCamera /> {status === "starting" ? "Opening camera…" : "Turn on camera"}</button>
              </>
            ) : (
              <>
                <h3 className="h3">{status === "denied" ? "Camera access is off" : status === "unsupported" ? "This browser can't open the camera" : "The camera didn't start"}</h3>
                <p className="muted">{msg || (status === "denied" ? "You can allow it from your browser's site settings — or try the piece on a photo instead." : "Try a photo instead — it works just as well.")}</p>
                <button className="btn btn--ghost" onClick={startCamera}>Try again</button>
              </>
            )}
            <label className="text-link studio__photo">or try it on a photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && usePhoto(e.target.files[0])} /></label>
          </div>
        )}
        {live && (
          <div className="studio__hud">
            <span className={cx("studio__state", tracking)}>{tracking === "locked" ? "● Tracking" : tracking === "manual" ? "Drag to place" : piece.anchor === "wrist" ? "Show your wrist" : "Face the camera"}</span>
            {status === "live" && tracking !== "manual" && <button className="chip chip--dark" onClick={() => setTracking("manual")}>Place manually</button>}
            {tracking === "manual" && status === "live" && trackers.current[piece.anchor] !== "failed" && <button className="chip chip--dark" onClick={() => setTracking("searching")}>Auto-track</button>}
          </div>
        )}
        {shot && (
          <div className="studio__shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt={`Snapshot wearing ${piece.name}`} />
            <div className="studio__shot-actions">
              <button className="btn btn--light btn--sm" onClick={share}><IconShare /> Share</button>
              <a className="btn btn--outline-light btn--sm" href={shot} download={`nemara-${piece.handle}.jpg`}><IconDownload /> Save</a>
              <button className="btn btn--outline-light btn--sm" onClick={() => setShot(null)}>Retake</button>
            </div>
          </div>
        )}
      </div>

      <div className="studio__panel">
        {live && (tracking === "manual" || status === "photo") && (
          <label className="studio__size"><span className="label">Size</span>
            <input type="range" min={0.05} max={0.9} step={0.01} value={manual.s} onChange={(e) => setManual((m) => ({ ...m, s: Number(e.target.value) }))} />
          </label>
        )}
        <div className="studio__picker" role="listbox" aria-label="Choose a piece to try">
          {pieces.map((p) => (
            <button key={p.handle} role="option" aria-selected={p.handle === piece.handle} className={cx("studio__pick", p.handle === piece.handle && "is-on")} onClick={() => setPiece(p)}>
              <span className="frame ratio-11"><Image src={p.image} alt="" fill sizes="72px" unoptimized /></span>
              <span className="studio__pick-name">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="studio__actions">
          {live && <button className="btn btn--ghost" onClick={snapshot}><IconCamera /> Snapshot</button>}
          {piece.needsSize
            ? <a className="btn" href={`/product/${piece.handle}`}>Choose size — {formatPrice(piece.price)}</a>
            : <button className="btn" onClick={() => add({ handle: piece.handle, name: piece.name, price: piece.price, image: piece.image })}>Add to bag — {formatPrice(piece.price)}</button>}
        </div>
      </div>
    </div>
  );
}
