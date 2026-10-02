"use client";
import { useStore } from "./StoreProvider";
export function Toast() {
  const { toast } = useStore();
  return <div className={`toast ${toast ? "is-on" : ""}`} role="status" aria-live="polite">{toast}</div>;
}
