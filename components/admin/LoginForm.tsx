"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="a-form">
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <label className="a-field"><span>Email</span><input key={state?.email ?? ""} name="email" type="email" autoComplete="username" required className="a-input" defaultValue={state?.email} /></label>
      <label className="a-field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required className="a-input" /></label>
      {state?.error && <p className="a-error" role="alert">{state.error}</p>}
      <button className="a-btn a-btn--primary a-btn--block" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
