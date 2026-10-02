import { LoginForm } from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/brand/Logo";
import { adminConfigured } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="login">
      <div className="login__card">
        <Wordmark className="login__logo" />
        <p className="login__sub">Studio — orders, inventory &amp; marketing</p>
        {!adminConfigured() && <p className="a-alert">Login isn&apos;t configured on this deployment yet (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET).</p>}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
