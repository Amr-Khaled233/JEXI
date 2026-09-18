import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { adminLogoutAction } from "@/app/admin/actions/auth";
import { AdminNav } from "@/components/admin/nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · JEXI Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 lg:justify-center lg:py-7">
          <Link href="/admin" aria-label="Dashboard home">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
          </div>
        </div>
        <AdminNav />
        <div className="hidden space-y-3 border-t border-border p-4 text-sm lg:block">
          <p className="truncate">
            {admin.name}
            <span className="block truncate text-xs text-muted">{admin.email}</span>
          </p>
          <div className="flex items-center justify-between">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-xs text-muted hover:text-gold">
              View store <ExternalLink className="size-3" />
            </Link>
            <ThemeToggle className="size-8" />
          </div>
          <form action={adminLogoutAction}>
            <button type="submit" className="text-xs tracking-[0.14em] text-muted uppercase hover:text-danger">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
        <form action={adminLogoutAction} className="px-4 pb-8 text-center lg:hidden">
          <button type="submit" className="text-xs tracking-[0.14em] text-muted uppercase hover:text-danger">
            Sign out ({admin.email})
          </button>
        </form>
      </div>
    </div>
  );
}
