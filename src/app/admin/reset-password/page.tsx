import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/password-reset-forms";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/ui/field";
import { findValidResetToken } from "@/lib/password-reset";

export const metadata: Metadata = { title: "Reset password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const reset = await findValidResetToken(token);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg px-4 py-12">
      <Logo size="lg" />
      <div className="card w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl">Choose a new password</h1>
        {reset ? (
          <>
            <p className="mb-6 text-sm text-muted">For {reset.admin.email}. You&apos;ll be signed out everywhere and can sign in with the new password.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <Alert tone="error">This reset link is invalid, already used, or expired.</Alert>
            <Link href="/admin/forgot-password" className="inline-block text-sm text-gold underline underline-offset-4">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
