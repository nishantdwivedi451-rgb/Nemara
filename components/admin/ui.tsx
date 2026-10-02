import type { OrderStatus } from "@/lib/oms";
import { STATUS_LABEL } from "@/lib/oms";

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const when = (iso?: string) => iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
export const day = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return <header className="a-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{actions && <div className="a-head__actions">{actions}</div>}</header>;
}
export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="a-kpi"><span className="a-kpi__label">{label}</span><span className="a-kpi__value">{value}</span>{hint && <span className="a-kpi__hint">{hint}</span>}</div>;
}
export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`a-pill a-pill--${status}`}>{STATUS_LABEL[status]}</span>;
}
export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return <div className="a-empty"><p className="a-empty__title">{title}</p>{body && <p>{body}</p>}{action}</div>;
}
