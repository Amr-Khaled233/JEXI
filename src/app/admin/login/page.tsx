import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg px-4 py-12">
      <Logo size="lg" />
      <div className="card w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl">Dashboard</h1>
        <p className="mb-6 text-sm text-muted">Sign in to manage your store.</p>
        <AdminLoginForm next={next} />
      </div>
    </div>
  );
}
