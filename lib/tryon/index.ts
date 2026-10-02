"use client";
import type { TryOnProvider } from "./types";
import { mediapipeProvider } from "./mediapipe";

// Select with NEXT_PUBLIC_TRY_ON_PROVIDER. Register production vendors here (e.g. a WebAR SDK
// implementing `mount`) — the Try-On UI, product data and analytics stay unchanged.
const providers: Record<string, TryOnProvider> = { mediapipe: mediapipeProvider };

export function getTryOnProvider(): TryOnProvider {
  return providers[process.env.NEXT_PUBLIC_TRY_ON_PROVIDER || "mediapipe"] ?? mediapipeProvider;
}
export type * from "./types";
