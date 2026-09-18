import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/admin/password-reset-forms";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg px-4 py-12">
      <Logo size="lg" />
      <div className="card w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl">Forgot password</h1>
        <p className="mb-6 text-sm text-muted">Enter your admin email and we&apos;ll send you a link to choose a new password.</p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
