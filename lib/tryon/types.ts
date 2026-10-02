import type { TryOnAnchor } from "@/lib/commerce/types";

/** A detected anchor: x/y normalised to the frame (0..1); scale in frame-height units; angle in radians. */
export type AnchorPoint = { x: number; y: number; scale: number; angle: number; visible: boolean };
export type Pose = { points: AnchorPoint[] };

export interface Tracker {
  detect(source: HTMLVideoElement | HTMLImageElement, timestampMs: number): Pose | null;
  close(): void;
}

export type TryOnProductRef = { handle: string; sku: string; name: string; anchor: TryOnAnchor; overlay: string; scale?: number; arAsset?: { provider: string; ref: string } | null };

/**
 * TRY_ON_PROVIDER abstraction.
 *  - Tracking providers implement `createTracker` and Nemara renders the overlay (prototype: MediaPipe).
 *  - Managed vendor SDKs implement `mount` and render their own camera experience inside Nemara's UI shell.
 */
export interface TryOnProvider {
  readonly id: string;
  readonly label: string;
  createTracker?(anchor: TryOnAnchor): Promise<Tracker>;
  mount?(el: HTMLElement, product: TryOnProductRef): Promise<() => void>;
}
