"use client";
import { useState } from "react";
import type { Address } from "@/components/layout/StoreProvider";

export const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

export function AddressForm({ initial, defaultName, defaultPhone, onSave, onCancel }: {
  initial?: Address; defaultName: string; defaultPhone: string;
  onSave: (a: Partial<Address>) => Promise<{ error?: string; fields?: Record<string, string> }>; onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true); setErrors({}); setError("");
    const d = await onSave({ id: initial?.id, label: f.label || "Home", name: f.name, phone: f.phone, line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode, isDefault: f.isDefault === "on" });
    setBusy(false);
    if (d.error) { setErrors(d.fields ?? {}); setError(d.error); }
  }
  const err = (k: string) => errors[k] && <span className="field-error">{errors[k]}</span>;
  return (
    <form className="form addr-form" onSubmit={submit} noValidate>
      <div className="form__row">
        <label className="field"><span className="label">Label</span><input name="label" className="input" defaultValue={initial?.label ?? "Home"} placeholder="Home, Office, Mum's…" /></label>
        <label className="field"><span className="label">Recipient</span><input name="name" className="input" defaultValue={initial?.name ?? defaultName} autoComplete="name" required />{err("name")}</label>
      </div>
      <label className="field"><span className="label">Mobile</span><input name="phone" className="input" defaultValue={initial?.phone ?? defaultPhone} inputMode="tel" autoComplete="tel-national" required />{err("phone")}</label>
      <label className="field"><span className="label">Address</span><input name="line1" className="input" defaultValue={initial?.line1} autoComplete="address-line1" placeholder="House, street, area" required />{err("line1")}</label>
      <label className="field"><span className="label">Landmark <span className="muted">(optional)</span></span><input name="line2" className="input" defaultValue={initial?.line2} autoComplete="address-line2" /></label>
      <div className="form__row form__row--3">
        <label className="field"><span className="label">PIN code</span><input name="pincode" className="input" defaultValue={initial?.pincode} inputMode="numeric" maxLength={6} autoComplete="postal-code" required />{err("pincode")}</label>
        <label className="field"><span className="label">City</span><input name="city" className="input" defaultValue={initial?.city} autoComplete="address-level2" required />{err("city")}</label>
        <label className="field"><span className="label">State</span><select name="state" className="select" defaultValue={initial?.state ?? ""} required><option value="">Select</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>{err("state")}</label>
      </div>
      <label className="check"><input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} /> Make this my default address</label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="addr-form__ctas"><button className="btn btn--sm" disabled={busy}>{busy ? "Saving…" : "Save address"}</button><button type="button" className="text-link muted" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
