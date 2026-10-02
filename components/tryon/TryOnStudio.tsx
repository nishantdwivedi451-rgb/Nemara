"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTryOnProvider, type AnchorPoint, type Tracker } from "@/lib/tryon";
import type { TryOnPiece } from "@/lib/tryon/piece";
import type { TryOnAnchor } from "@/lib/commerce/types";
import { IconCamera, IconClose, IconDownload, IconEye, IconFlip, IconImage, IconLock, IconRefresh, IconShare, IconSliders } from "@/components/brand/Icons";
import { useStore } from "@/components/layout/StoreProvider";
import { track } from "@/lib/analytics";
import { formatPrice, cx } from "@/lib/format";

type Phase = "intro" | "starting" | "live" | "photo" | "denied" | "unsupported" | "error";
type Tracking = "loading" | "searching" | "locked" | "manual";

/** Where each overlay attaches inside its image, and how large it renders relative to the anchor scale. */
const GEO: Record<TryOnAnchor, { ax: number; ay: number; k: number; aspect: number }> = {
  ears: { ax: 0.5, ay: 0.1, k: 0.62, aspect: 1 },
  neck: { ax: 0.5, ay: 0.725, k: 1.05, aspect: 1 },
  wrist: { ax: 0.5, ay: 0.5, k: 1.25, aspect: 0.5 },
};
/** Manual placement defaults, in stage-normalised coordinates; `s` = rendered width / stage height. */
const MANUAL: Record<TryOnAnchor, { x: number; y: number; s: number }> = {
  ears: { x: 0.34, y: 0.52, s: 0.14 }, neck: { x: 0.5, y: 0.74, s: 0.5 }, wrist: { x: 0.5, y: 0.6, s: 0.42 },
};
const ANCHOR_LABEL: Record<TryOnAnchor, string> = { ears: "Earrings", neck: "Necklaces", wrist: "Wrist" };
const HINT: Record<Tracking, Record<TryOnAnchor, string>> = {
  loading: { ears: "Preparing the mirror…", neck: "Preparing the mirror…", wrist: "Preparing the mirror…" },
  searching: { ears: "Centre your face in the arch", neck: "Centre your face, shoulders in view", wrist: "Hold your wrist up to the camera" },
  locked: { ears: "", neck: "", wrist: "" },
  manual: { ears: "Drag to place · pinch to resize", neck: "Drag to place · pinch to resize", wrist: "Drag to place · pinch to resize" },
};

type Swing = { th: number; om: number; px: number; vx: number; alpha: number; x: number; y: number; s: number; a: number };

export function TryOnStudio({ pieces, initial, variant = "page", onClose }: { pieces: TryOnPiece[]; initial?: string; variant?: "page" | "modal"; onClose?: () => void }) {
  const provider = getTryOnProvider();
  const { add } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [tracking, setTracking] = useState<Tracking>("loading");
  const [autoAvailable, setAutoAvailable] = useState(true);
  const [piece, setPiece] = useState<TryOnPiece>(() => pieces.find((p) => p.handle === initial) ?? pieces[0]);
  const [filter, setFilter] = useState<TryOnAnchor | "all">("all");
  const [manual, setManual] = useState(MANUAL[piece.anchor]);
  const [comparing, setComparing] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [canFlip, setCanFlip] = useState(false);
  const [msg, setMsg] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackers = useRef<Partial<Record<TryOnAnchor, Tracker | "failed" | "pending">>>({});
  const overlays = useRef<Record<string, HTMLImageElement>>({});
  const swing = useRef<Swing[]>([]);
  const lastSeen = useRef(0);
  const lastT = useRef(0);
  const raf = useRef(0);
  const liveSince = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  // refs mirror state for the render loop
  const S = useRef({ piece, manual, tracking, comparing, facing, phase });
  S.current = { piece, manual, tracking, comparing, facing, phase };

  const overlayFor = (src: string) => {
    if (!overlays.current[src]) { const im = new window.Image(); im.src = src; overlays.current[src] = im; }
    return overlays.current[src];
  };
  useEffect(() => { pieces.forEach((p) => overlayFor(p.overlay)); }, [pieces]);

  const ensureTracker = useCallback(async (anchor: TryOnAnchor) => {
    const t = trackers.current[anchor];
    if (t && t !== "failed") return;
    if (!provider.createTracker) { setAutoAvailable(false); setTracking("manual"); return; }
    trackers.current[anchor] = "pending";
    if (S.current.tracking !== "manual") setTracking("loading");
    try {
      trackers.current[anchor] = await provider.createTracker(anchor);
      setAutoAvailable(true);
      if (S.current.tracking === "loading") setTracking("searching");
    } catch (e) {
      console.warn("[try-on] auto-tracking unavailable; manual placement", e);
      trackers.current[anchor] = "failed";
      setAutoAvailable(false);
      setTracking("manual");
    }
  }, [provider]);

  /* ───────── render loop ───────── */
  const draw = useCallback(() => {
    const cv = canvasRef.current, stage = stageRef.current, ctx = cv?.getContext("2d");
    const { piece: p, manual: m, tracking: tr, comparing: cmp, facing: fc, phase: ph } = S.current;
    const isPhoto = ph === "photo";
    const src: HTMLVideoElement | HTMLImageElement | null = isPhoto ? photoRef.current : videoRef.current;
    if (!cv || !ctx || !stage || !src) return;
    const vw = "videoWidth" in src ? src.videoWidth : src.naturalWidth;
    const vh = "videoHeight" in src ? src.videoHeight : src.naturalHeight;
    if (!vw || !vh) { raf.current = requestAnimationFrame(draw); return; }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(stage.clientWidth * dpr), H = Math.round(stage.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const now = performance.now();
    const dt = Math.min(0.05, (now - (lastT.current || now)) / 1000) || 0.016;
    lastT.current = now;

    // cover-fit the source into the stage
    const sc = Math.max(W / vw, H / vh), dw = vw * sc, dh = vh * sc, ox = (W - dw) / 2, oy = (H - dh) / 2;
    const mirror = !isPhoto && fc === "user";
    ctx.save();
    if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, ox, oy, dw, dh);
    ctx.restore();

    // detection
    const t = trackers.current[p.anchor];
    let pts: AnchorPoint[] | null = null;
    if (tr !== "manual" && t && t !== "failed" && t !== "pending" && !isPhoto) {
      try { pts = t.detect(src, now)?.points ?? null; } catch { pts = null; }
      if (pts) { lastSeen.current = now; if (tr !== "locked") setTracking("locked"); }
      else if (now - lastSeen.current > 700 && tr === "locked") setTracking("searching");
    }
    if (isPhoto && tr === "locked" && swing.current.length) pts = null; // photo pose is frozen in swing state

    // targets in screen space
    type Target = { x: number; y: number; s: number; a: number; visible: boolean };
    let targets: Target[] = [];
    if (pts) {
      targets = pts.map((q) => {
        const x = ox + q.x * dw, y = oy + q.y * dh;
        return { x: mirror ? W - x : x, y, s: q.scale * dh, a: mirror ? -q.angle : q.angle, visible: q.visible };
      });
    } else if (tr === "manual" || (isPhoto && !swing.current.length)) {
      targets = [{ x: m.x * W, y: m.y * H, s: (m.s * H) / GEO[p.anchor].k, a: 0, visible: true }];
    } else if (isPhoto) {
      targets = swing.current.map((w) => ({ x: w.x, y: w.y, s: w.s, a: w.a, visible: true }));
    }

    // smoothing + earring pendulum physics
    const sw = swing.current;
    if (tr === "manual" && sw.length > 1) sw.length = 1;
    while (sw.length < targets.length) sw.push({ th: 0, om: 0, px: targets[sw.length].x, vx: 0, alpha: 0, x: targets[sw.length].x, y: targets[sw.length].y, s: targets[sw.length].s, a: targets[sw.length].a });
    if (!targets.length) sw.forEach((w) => { w.alpha += (0 - w.alpha) * 0.18; });
    targets.forEach((tg, i) => {
      const w = sw[i];
      const k = tr === "manual" ? 1 : 0.42;
      w.x += (tg.x - w.x) * k; w.y += (tg.y - w.y) * k; w.s += (tg.s - w.s) * 0.3; w.a += (tg.a - w.a) * 0.3;
      w.alpha += ((tg.visible ? 1 : 0) - w.alpha) * 0.18;
      if (p.anchor === "ears") {
        const vx = (w.x - w.px) / dt; const ax = (vx - w.vx) / dt;
        w.px = w.x; w.vx = vx;
        const acc = -70 * (w.th - w.a) - 6.5 * w.om - ax * 0.00055 / dpr;
        w.om += acc * dt; w.th += w.om * dt;
        w.th = Math.max(w.a - 0.55, Math.min(w.a + 0.55, w.th));
      } else { w.th = w.a; }
    });
    sw.length = Math.max(targets.length, sw.filter((w) => w.alpha > 0.02).length);

    // jewellery
    const ov = overlayFor(p.overlay), g = GEO[p.anchor];
    if (!cmp && ov.complete && ov.naturalWidth) {
      sw.forEach((w) => {
        if (w.alpha < 0.02) return;
        const width = w.s * g.k * (p.scale ?? 1), height = width * g.aspect;
        ctx.save();
        ctx.globalAlpha = Math.min(1, w.alpha);
        ctx.translate(w.x, w.y);
        ctx.rotate(w.th);
        ctx.shadowColor = "rgba(20, 8, 28, 0.38)"; ctx.shadowBlur = 12 * dpr; ctx.shadowOffsetY = 4 * dpr;
        ctx.drawImage(ov, -width * g.ax, -height * g.ay, width, height);
        ctx.restore();
      });
    }
    if (!isPhoto) raf.current = requestAnimationFrame(draw);
  }, []);

  const redrawPhoto = useCallback(() => { if (S.current.phase === "photo") requestAnimationFrame(draw); }, [draw]);

  /* ───────── camera ───────── */
  const stopStream = useCallback(() => {
    cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = async (face: "user" | "environment" = facing) => {
    setMsg(""); setShot(null);
    if (!navigator.mediaDevices?.getUserMedia) { setPhase("unsupported"); return; }
    stopStream();
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      photoRef.current = null; swing.current = [];
      setFacing(face);
      setPhase("live");
      liveSince.current = Date.now();
      if (variant === "page" && window.innerWidth < 1000) stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      track("try_on_started", { item_id: piece.handle, anchor: piece.anchor, mode: "camera", provider: provider.id });
      navigator.mediaDevices.enumerateDevices?.().then((d) => setCanFlip(d.filter((x) => x.kind === "videoinput").length > 1)).catch(() => {});
      if (S.current.tracking !== "manual") ensureTracker(piece.anchor);
      raf.current = requestAnimationFrame(draw);
    } catch (e) {
      const name = (e as DOMException).name;
      setPhase(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      setMsg(name === "NotFoundError" ? "We couldn't find a camera on this device." : "");
    }
  };

  const usePhoto = (file: File) => {
    stopStream();
    const im = new window.Image();
    im.onload = async () => {
      photoRef.current = im; swing.current = []; setShot(null);
      setPhase("photo");
      track("try_on_started", { item_id: piece.handle, anchor: piece.anchor, mode: "photo", provider: provider.id });
      await ensureTracker(piece.anchor);
      const t = trackers.current[S.current.piece.anchor];
      let placed = false;
      if (t && t !== "failed" && t !== "pending") {
        try {
          const pose = t.detect(im, performance.now());
          const stage = stageRef.current;
          if (pose && stage) {
            // freeze the detected pose into screen space
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const W = stage.clientWidth * dpr, H = stage.clientHeight * dpr;
            const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight), dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
            const ox = (W - dw) / 2, oy = (H - dh) / 2;
            swing.current = pose.points.filter((q) => q.visible).map((q) => ({ th: q.angle, om: 0, px: 0, vx: 0, alpha: 1, x: ox + q.x * dw, y: oy + q.y * dh, s: q.scale * dh, a: q.angle }));
            placed = swing.current.length > 0;
          }
        } catch { /* fall through to manual */ }
      }
      setTracking(placed ? "locked" : "manual");
      requestAnimationFrame(draw);
    };
    im.src = URL.createObjectURL(file);
  };

  // piece switch: reset placement, load a face↔hand tracker if needed
  useEffect(() => {
    setManual(MANUAL[piece.anchor]);
    swing.current = [];
    if (phase === "live") {
      if (piece.anchor === "wrist" && facing === "user" && canFlip) { /* leave camera choice to the user */ }
      if (tracking !== "manual" || autoAvailable) { setTracking("loading"); ensureTracker(piece.anchor); }
    }
    if (phase === "photo") { setTracking("manual"); requestAnimationFrame(draw); }
  }, [piece]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { redrawPhoto(); }, [manual, comparing, redrawPhoto]);
  useEffect(() => {
    const onResize = () => redrawPhoto();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redrawPhoto]);

  useEffect(() => () => {
    stopStream();
    if (liveSince.current && Date.now() - liveSince.current > 5000) track("try_on_completed", { item_id: S.current.piece.handle, reason: "session" });
    Object.values(trackers.current).forEach((t) => t && typeof t === "object" && t.close());
  }, [stopStream]);

  /* ───────── snapshot: a branded Nemara card ───────── */
  const snapshot = async () => {
    const cv = canvasRef.current;
    if (!cv) return;
    setFlash(true); window.setTimeout(() => setFlash(false), 380);
    const band = Math.round(cv.width * 0.2);
    const out = document.createElement("canvas");
    out.width = cv.width; out.height = cv.height + band;
    const o = out.getContext("2d")!;
    o.fillStyle = "#FCFAF6"; o.fillRect(0, 0, out.width, out.height);
    o.drawImage(cv, 0, 0);
    await document.fonts?.ready;
    const serif = getComputedStyle(document.documentElement).getPropertyValue("--ff-serif").trim() || "serif";
    const sans = getComputedStyle(document.documentElement).getPropertyValue("--ff-sans").trim() || "sans-serif";
    const pad = Math.round(out.width * 0.06);
    o.fillStyle = "#4B1D5C";
    o.font = `${Math.round(band * 0.22)}px ${serif}`;
    o.textBaseline = "middle";
    // letter-spaced wordmark
    let x = pad; for (const ch of "NEMARA") { o.fillText(ch, x, cv.height + band * 0.38); x += o.measureText(ch).width + band * 0.06; }
    o.fillStyle = "#21102A"; o.font = `italic ${Math.round(band * 0.2)}px ${serif}`;
    o.fillText(piece.name, pad, cv.height + band * 0.68);
    o.fillStyle = "#5A5260"; o.font = `${Math.round(band * 0.1)}px ${sans}`; o.textAlign = "right";
    o.fillText("Wear your story.", out.width - pad, cv.height + band * 0.38);
    o.fillText(formatPrice(piece.price), out.width - pad, cv.height + band * 0.68);
    setShot(out.toDataURL("image/jpeg", 0.92));
    track("try_on_completed", { item_id: piece.handle, reason: "snapshot" });
  };
  const share = async () => {
    if (!shot) return;
    const blob = await (await fetch(shot)).blob();
    const file = new File([blob], `nemara-${piece.handle}.jpg`, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `${piece.name} — Nemara`, text: "Trying on Nemara. Wear your story." }); } catch { /* cancelled */ }
    } else { const a = document.createElement("a"); a.href = shot; a.download = file.name; a.click(); }
  };

  /* ───────── manual placement: drag, pinch, wheel ───────── */
  const toStage = (e: React.PointerEvent | React.WheelEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (S.current.tracking !== "manual" || (phase !== "live" && phase !== "photo") || shot) return;
    if ((e.target as HTMLElement).closest("button, a, input, label")) return;
    const pt = toStage(e);
    if (e.type === "pointerdown") { pointers.current.set(e.pointerId, pt); e.currentTarget.setPointerCapture(e.pointerId); }
    if (e.type === "pointermove" && pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, pt);
      const ps = [...pointers.current.values()];
      if (ps.length >= 2) {
        const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        if (!pinch.current) pinch.current = { d, s: manual.s };
        const ns = Math.min(0.9, Math.max(0.05, pinch.current.s * (d / pinch.current.d)));
        setManual((m) => ({ ...m, s: ns }));
      } else setManual((m) => ({ ...m, x: Math.min(1, Math.max(0, pt.x)), y: Math.min(1, Math.max(0, pt.y)) }));
    }
    if (e.type === "pointerup" || e.type === "pointercancel") { pointers.current.delete(e.pointerId); if (pointers.current.size < 2) pinch.current = null; }
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (S.current.tracking !== "manual") return;
    setManual((m) => ({ ...m, s: Math.min(0.9, Math.max(0.05, m.s * (e.deltaY < 0 ? 1.06 : 0.94))) }));
  };

  const toggleAdjust = () => {
    if (tracking === "manual") {
      if (autoAvailable && phase === "live") { setTracking("loading"); ensureTracker(piece.anchor).then(() => setTracking((t) => (t === "loading" ? "searching" : t))); }
    } else {
      // start manual placement where the piece currently is
      const st = stageRef.current, w = swing.current[0];
      if (st && w) { const dpr = Math.min(window.devicePixelRatio || 1, 2); setManual({ x: w.x / (st.clientWidth * dpr), y: w.y / (st.clientHeight * dpr), s: (w.s * GEO[piece.anchor].k) / (st.clientHeight * dpr) }); }
      setTracking("manual");
    }
  };

  const live = phase === "live" || phase === "photo";
  const list = useMemo(() => (filter === "all" ? pieces : pieces.filter((p) => p.anchor === filter)), [pieces, filter]);
  const anchors = useMemo(() => [...new Set(pieces.map((p) => p.anchor))], [pieces]);
  const hint = shot ? "" : !autoAvailable && tracking === "manual" ? "Auto-tracking isn't available here — drag to place, pinch to resize" : HINT[tracking][piece.anchor];
  const status = phase === "photo" ? (tracking === "locked" ? "Placed on your photo" : "Photo · manual") : tracking === "locked" ? "Tracking" : tracking === "manual" ? "Manual placement" : tracking === "loading" ? "Preparing" : "Looking for you";

  return (
    <div className={cx("studio", `studio--${variant}`, live && "is-live")}>
      <div
        ref={stageRef}
        className={cx("studio__stage", tracking === "manual" && live && "is-manual")}
        onPointerDown={onPointer} onPointerMove={onPointer} onPointerUp={onPointer} onPointerCancel={onPointer} onWheel={onWheel}
      >
        <video ref={videoRef} playsInline muted className="studio__video" aria-hidden="true" />
        <canvas ref={canvasRef} className={cx("studio__canvas", live && "is-on")} role="img" aria-label={`Live try-on preview of ${piece.name}`} />

        {/* face / wrist guide while searching */}
        {live && phase === "live" && (tracking === "searching" || tracking === "loading") && (
          <div className={cx("studio__guide", `studio__guide--${piece.anchor}`)} aria-hidden="true">
            <svg viewBox="0 0 100 130" preserveAspectRatio="none"><path d="M6 128V42C6 24 32 12 50 4C68 12 94 24 94 42V128" /></svg>
            <span className="studio__scan" />
          </div>
        )}

        {/* top bar */}
        <div className="studio__top">
          {live ? <span className={cx("studio__status", tracking)}><i />{status}</span> : <span className="studio__brand">The Nemara mirror</span>}
          <div className="studio__top-actions">
            {phase === "live" && canFlip && <button className="studio__icon" onClick={() => startCamera(facing === "user" ? "environment" : "user")} aria-label="Switch camera"><IconFlip /></button>}
            {onClose && <button className="studio__icon" onClick={onClose} aria-label="Close try-on"><IconClose /></button>}
          </div>
        </div>

        {live && hint && <p className="studio__hint" aria-live="polite">{hint}</p>}
        {live && tracking === "loading" && <span className="studio__progress" aria-hidden="true" />}

        {/* intro / errors */}
        {!live && (
          <div className="studio__intro">
            <div className="studio__arch">
              <svg viewBox="0 0 100 130" aria-hidden="true"><path d="M2 128V42C2 22 30 10 50 2C70 10 98 22 98 42V128" /></svg>
              <div className="studio__arch-img"><Image src={piece.image} alt="" fill sizes="220px" unoptimized /></div>
            </div>
            {phase === "intro" || phase === "starting" ? (
              <>
                <h3 className="studio__title">See it on you.</h3>
                <p className="studio__lede">Try <em>{piece.name}</em> live with your camera — it moves with you, like a mirror.</p>
                <div className="studio__ctas">
                  <button className="studio__btn" onClick={() => startCamera()} disabled={phase === "starting"}><IconCamera />{phase === "starting" ? "Opening camera…" : "Start the mirror"}</button>
                  <label className="studio__btn studio__btn--ghost"><IconImage />Use a photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && usePhoto(e.target.files[0])} /></label>
                </div>
                <ul className="studio__tips"><li>Good, even light</li><li>Hair tucked back</li><li>Hold steady</li></ul>
              </>
            ) : (
              <>
                <h3 className="studio__title">{phase === "denied" ? "Camera access is off" : phase === "unsupported" ? "Camera unavailable here" : "The camera didn't start"}</h3>
                <p className="studio__lede">{msg || (phase === "denied" ? "Allow camera access in your browser's site settings, or try the piece on a photo instead." : "You can still try the piece on a photo — it works just as well.")}</p>
                <div className="studio__ctas">
                  <button className="studio__btn" onClick={() => startCamera()}><IconRefresh />Try again</button>
                  <label className="studio__btn studio__btn--ghost"><IconImage />Use a photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && usePhoto(e.target.files[0])} /></label>
                </div>
              </>
            )}
            <p className="studio__privacy"><IconLock width={14} height={14} />Private by design — processed on your device, never uploaded.</p>
          </div>
        )}

        {/* controls */}
        {live && !shot && (
          <div className="studio__controls">
            {variant === "page" && pieces.length > 1 && (
              <div className="studio__strip" role="listbox" aria-label="Switch piece">
                {pieces.map((p) => (
                  <button key={p.handle} role="option" aria-selected={p.handle === piece.handle} className={cx("studio__chip", p.handle === piece.handle && "is-on")} onClick={() => setPiece(p)} aria-label={p.name}>
                    <Image src={p.image} alt="" fill sizes="56px" unoptimized />
                  </button>
                ))}
              </div>
            )}
            <div className="studio__bar">
              <button className={cx("studio__tool", tracking === "manual" && "is-on")} onClick={toggleAdjust} aria-pressed={tracking === "manual"}>
                <IconSliders /><span>{tracking === "manual" && autoAvailable && phase === "live" ? "Auto" : "Adjust"}</span>
              </button>
              <button className="studio__shutter" onClick={snapshot} aria-label="Take a snapshot"><span /></button>
              <button className={cx("studio__tool", comparing && "is-on")} aria-pressed={comparing}
                onPointerDown={() => setComparing(true)} onPointerUp={() => setComparing(false)} onPointerLeave={() => setComparing(false)}
                onKeyDown={(e) => e.key === " " && setComparing(true)} onKeyUp={() => setComparing(false)}>
                <IconEye /><span>Hold to compare</span>
              </button>
            </div>
            {tracking === "manual" && (
              <label className="studio__size"><span>Size</span>
                <input type="range" min={0.05} max={0.9} step={0.005} value={manual.s} onChange={(e) => setManual((m) => ({ ...m, s: Number(e.target.value) }))} />
                <button className="studio__reset" onClick={() => setManual(MANUAL[piece.anchor])}>Reset</button>
              </label>
            )}
          </div>
        )}

        {flash && <div className="studio__flash" aria-hidden="true" />}

        {/* result */}
        {shot && (
          <div className="studio__result">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt={`Snapshot wearing ${piece.name}`} />
            <div className="studio__result-actions">
              <button className="studio__btn" onClick={share}><IconShare />Share</button>
              <a className="studio__btn studio__btn--ghost" href={shot} download={`nemara-${piece.handle}.jpg`}><IconDownload />Save</a>
              <button className="studio__btn studio__btn--ghost" onClick={() => setShot(null)}><IconRefresh />Retake</button>
            </div>
          </div>
        )}
      </div>

      {/* product panel */}
      <aside className="studio__panel" aria-label="Piece details">
        <div className="studio__piece">
          <p className="eyebrow">Now trying</p>
          <h3 className="h2">{piece.name}</h3>
          <p className="studio__price">{formatPrice(piece.price)}</p>
          <div className="studio__buy">
            {piece.needsSize
              ? <Link className="btn btn--block" href={`/product/${piece.handle}`}>Choose your size</Link>
              : <button className="btn btn--block" onClick={() => add({ handle: piece.handle, name: piece.name, price: piece.price, image: piece.image })}>Add to bag</button>}
            <Link className="btn btn--ghost btn--block" href={`/product/${piece.handle}`}>View the piece &amp; its story</Link>
          </div>
        </div>

        {variant === "page" && pieces.length > 1 && (
          <div className="studio__picker">
            {anchors.length > 1 && (
              <div className="studio__tabs" role="tablist" aria-label="Filter pieces">
                {(["all", ...anchors] as const).map((a) => (
                  <button key={a} role="tab" aria-selected={filter === a} className={cx("studio__tab", filter === a && "is-on")} onClick={() => setFilter(a)}>{a === "all" ? "All" : ANCHOR_LABEL[a]}</button>
                ))}
              </div>
            )}
            <ul className="studio__list">
              {list.map((p) => (
                <li key={p.handle}>
                  <button className={cx("studio__item", p.handle === piece.handle && "is-on")} onClick={() => setPiece(p)} aria-pressed={p.handle === piece.handle}>
                    <span className="studio__item-img frame"><Image src={p.image} alt="" fill sizes="64px" unoptimized /></span>
                    <span className="studio__item-name">{p.name}</span>
                    <span className="studio__item-price">{formatPrice(p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
