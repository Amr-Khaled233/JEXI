"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { trackOrderAction } from "@/app/actions/track";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrderAction, undefined);

  if (state?.sentTo) {
    return (
      <div className="w-full text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/12 text-gold">
          <MailCheck className="size-7" strokeWidth={1.3} />
        </span>
        <h2 className="mt-6 text-3xl">Check your inbox</h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
          If there are orders for <span className="break-all text-fg">{state.sentTo}</span>, we&apos;ve just emailed you a link to each one.
        </p>
        <p className="mt-6 text-xs text-muted">Nothing there after a few minutes? Check your spam folder.</p>
        <Link href="/shop" className="mt-8 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-gold uppercase hover:text-gold-strong">
          Continue shopping <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="w-full space-y-6">
      <div>
        <h2 className="text-3xl">Find my orders</h2>
        <p className="mt-2 text-sm text-muted">Enter the email you used at checkout.</p>
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Email address" htmlFor="email">
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required className="h-12" />
      </Field>
      <Button type="submit" size="lg" className="h-12 w-full" loading={pending}>
        Email me my orders
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted">
        Your confirmation email also has a direct link to your order.
      </p>
    </form>
  );
}
