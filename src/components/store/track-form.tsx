"use client";

import { useActionState } from "react";
import { trackOrderAction } from "@/app/actions/track";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrderAction, undefined);
  return (
    <form action={action} className="card space-y-5 p-6">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Order number" htmlFor="orderNumber" hint="e.g. JX260918-12345 — it's in your confirmation email.">
        <Input id="orderNumber" name="orderNumber" required autoComplete="off" className="uppercase" />
      </Field>
      <Field label="Email or phone" htmlFor="contact">
        <Input id="contact" name="contact" required autoComplete="email" />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Track order
      </Button>
    </form>
  );
}
