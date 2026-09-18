"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(adminLoginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
