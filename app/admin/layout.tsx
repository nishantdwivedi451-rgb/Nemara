import type { Metadata } from "next";
import "@/styles/admin.css";

export const metadata: Metadata = { title: { default: "Nemara Studio", template: "%s · Nemara Studio" }, robots: { index: false, follow: false } };
export default function AdminRoot({ children }: { children: React.ReactNode }) { return <div className="studio-root">{children}</div>; }
