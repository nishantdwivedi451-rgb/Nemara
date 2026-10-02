"use client";
import { useEffect } from "react";
import { useStore } from "@/components/layout/StoreProvider";
import { AuthFlow } from "./AuthFlow";
import { IconClose } from "@/components/brand/Icons";

export function AuthDialog() {
  const { authReason, closeAuth, customer } = useStore();
  useEffect(() => {
    if (!authReason) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [authReason, closeAuth]);
  if (!authReason || customer) return null;
  return (
    <div className="auth-dialog" role="dialog" aria-modal="true" aria-label="Sign in to Nemara" onClick={(e) => e.target === e.currentTarget && closeAuth()}>
      <div className="auth-dialog__card">
        <button className="icon-btn auth-dialog__close" onClick={closeAuth} aria-label="Close"><IconClose /></button>
        <AuthFlow reason={authReason} onDone={() => window.setTimeout(closeAuth, 400)} />
        {authReason === "wishlist" && <button className="auth-dialog__skip text-link muted" onClick={closeAuth}>Not now — keep it on this device</button>}
      </div>
    </div>
  );
}
