"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestAdminPasswordResetAction, resetAdminPasswordAction } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestAdminPasswordResetAction, undefined);

  if (state?.sentTo) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-10 text-gold" strokeWidth={1.2} />
        <p className="text-sm leading-relaxed">
          If that email belongs to an admin account, a reset link was sent to the store&apos;s notification inbox <strong>{state.sentTo}</strong>. It expires in 30 minutes.
        </p>
        <p className="text-xs text-muted">Don&apos;t see it? Check the spam folder.</p>
        <Link href="/admin/login" className="inline-block text-sm text-gold underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Admin email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Send reset link
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-muted hover:text-gold">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAdminPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Field label="New password" htmlFor="password" hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Set new password
      </Button>
    </form>
  );
}
