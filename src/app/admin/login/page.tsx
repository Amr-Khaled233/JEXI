import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/ui/field";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams;
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg px-4 py-12">
      <Logo size="lg" />
      <div className="card w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl">Dashboard</h1>
        <p className="mb-6 text-sm text-muted">Sign in to manage your store.</p>
        {reset && (
          <Alert tone="success" className="mb-4">
            Password updated. Sign in with your new password.
          </Alert>
        )}
        <AdminLoginForm next={next} />
        <p className="mt-4 text-center text-sm">
          <Link href="/admin/forgot-password" className="text-muted hover:text-gold">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
