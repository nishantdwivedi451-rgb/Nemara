import { AccountView } from "@/components/account/AccountView";
export const metadata = { title: "Your account", robots: { index: false } };
export default function AccountPage() { return <div className="page-enter"><AccountView /></div>; }
