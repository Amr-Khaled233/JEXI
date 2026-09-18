"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addAddressAction, loginAction, registerAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Select } from "@/components/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? "/account"} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>
      <p className="text-center text-sm text-muted">
        New to JEXI?{" "}
        <Link href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? "/account"} />
      <Field label="Full name" htmlFor="name" error={fe.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mobile (optional)" htmlFor="phone" error={fe.phone}>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function AddressForm({ governorates }: { governorates: string[] }) {
  const [state, action, pending] = useActionState(addAddressAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" key={state?.success ? Date.now() : "form"}>
      {state?.error && <Alert tone="error" className="sm:col-span-2">{state.error}</Alert>}
      {state?.success && <Alert tone="success" className="sm:col-span-2">{state.success}</Alert>}
      <Field label="Label (optional)" htmlFor="label">
        <Input id="label" name="label" placeholder="Home, Work…" />
      </Field>
      <Field label="Full name" htmlFor="fullName" error={fe.fullName}>
        <Input id="fullName" name="fullName" required />
      </Field>
      <Field label="Mobile" htmlFor="addr-phone" error={fe.phone}>
        <Input id="addr-phone" name="phone" type="tel" placeholder="01XXXXXXXXX" required />
      </Field>
      <Field label="Governorate" htmlFor="governorate" error={fe.governorate}>
        <Select id="governorate" name="governorate" defaultValue="" required>
          <option value="" disabled>
            Select governorate
          </option>
          {governorates.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </Field>
      <Field label="Area / City" htmlFor="area" error={fe.area}>
        <Input id="area" name="area" required />
      </Field>
      <Field label="Street address" htmlFor="address" error={fe.address}>
        <Input id="address" name="address" placeholder="Street, building, floor, apartment" required />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" loading={pending}>
          Save address
        </Button>
      </div>
    </form>
  );
}
