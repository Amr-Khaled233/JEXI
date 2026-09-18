"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { placeOrderAction } from "@/app/actions/checkout";
import { OrderTotals, PromoCodeInput } from "@/components/store/cart-parts";
import { useCartQuote } from "@/components/store/use-cart-quote";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { COLORS } from "@/lib/constants";
import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Zone = { name: string; estimatedDelivery: string | null };
type SavedAddress = { id: string; label: string | null; fullName: string; phone: string; governorate: string; area: string; address: string };

export function CheckoutForm({
  zones,
  paymentMethods,
  customer,
  addresses,
}: {
  zones: Zone[];
  paymentMethods: { method: "COD"; label: string; description: string }[];
  customer: { name: string; email: string; phone: string } | null;
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  const firstAddress = addresses[0];
  const [form, setForm] = useState({
    name: firstAddress?.fullName ?? customer?.name ?? "",
    email: customer?.email ?? "",
    phone: firstAddress?.phone ?? customer?.phone ?? "",
    governorate: firstAddress && zones.some((z) => z.name === firstAddress.governorate) ? firstAddress.governorate : "",
    area: firstAddress?.area ?? "",
    address: firstAddress?.address ?? "",
    notes: "",
    paymentMethod: paymentMethods[0]?.method ?? "COD",
    saveAddress: addresses.length === 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [placed, setPlaced] = useState(false);

  const activePromo = useCart((s) => s.promoCode);
  const { quote, loading, hydrated, items, promoCode } = useCartQuote({
    governorate: form.governorate,
    // Only needed for per-customer promo limits.
    email: activePromo ? form.email : null,
    phone: activePromo ? form.phone : null,
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target instanceof HTMLInputElement && e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const zone = zones.find((z) => z.name === form.governorate);

  if (hydrated && items.length === 0 && !placed) {
    return (
      <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
        <p className="font-serif text-2xl">Your bag is empty</p>
        <Link href="/shop" className={buttonClasses("primary")}>
          Continue shopping
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const res = await placeOrderAction({ ...form, promoCode, items });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setPlaced(true);
      clear();
      router.replace(res.redirectUrl ?? `/order/${encodeURIComponent(res.orderNumber)}?t=${res.token}&new=1`);
    });
  };

  const blocked = !quote || quote.itemCount === 0 || quote.issues.length > 0 || (!!promoCode && quote.promo?.applied === false);

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_26rem]" noValidate>
      <div className="space-y-10">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Section step={1} title="Contact">
          {!customer && (
            <p className="-mt-2 mb-4 text-sm text-muted">
              Have an account?{" "}
              <Link href="/account/login?next=/checkout" className="text-gold underline underline-offset-4">
                Sign in
              </Link>{" "}
              for faster checkout.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} hint="For your order confirmation and updates.">
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={set("phone")} required />
            </Field>
          </div>
        </Section>

        <Section step={2} title="Shipping address">
          {addresses.length > 0 && (
            <Field label="Saved addresses" htmlFor="saved" className="mb-4">
              <Select
                id="saved"
                defaultValue={firstAddress?.id}
                onChange={(e) => {
                  const a = addresses.find((x) => x.id === e.target.value);
                  if (a)
                    setForm((f) => ({
                      ...f,
                      name: a.fullName,
                      phone: a.phone,
                      governorate: zones.some((z) => z.name === a.governorate) ? a.governorate : "",
                      area: a.area,
                      address: a.address,
                    }));
                }}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label} — ` : ""}
                    {a.address}, {a.area}, {a.governorate}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Governorate"
              htmlFor="governorate"
              error={errors.governorate}
              hint={zone?.estimatedDelivery ? `Estimated delivery: ${zone.estimatedDelivery}` : undefined}
            >
              <Select id="governorate" value={form.governorate} onChange={set("governorate")} required>
                <option value="" disabled>
                  Select governorate
                </option>
                {zones.map((z) => (
                  <option key={z.name} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Area / City" htmlFor="area" error={errors.area}>
              <Input id="area" autoComplete="address-level2" placeholder="e.g. Maadi, Smouha" value={form.area} onChange={set("area")} required />
            </Field>
            <Field label="Street address" htmlFor="address" error={errors.address} className="sm:col-span-2">
              <Input
                id="address"
                autoComplete="street-address"
                placeholder="Street, building no., floor, apartment"
                value={form.address}
                onChange={set("address")}
                required
              />
            </Field>
            <Field label="Delivery notes (optional)" htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" rows={2} placeholder="Landmark, best time to call…" value={form.notes} onChange={set("notes")} className="min-h-0" />
            </Field>
          </div>
          {customer && (
            <Checkbox className="mt-4" label="Save this address to my account" checked={form.saveAddress} onChange={set("saveAddress")} />
          )}
          {quote && (
            <p className="mt-4 text-sm">
              Shipping:{" "}
              <span className={cn(quote.shipping.free ? "text-gold" : "", !quote.shipping.available && "text-danger")}>
                {quote.shipping.label}
              </span>
            </p>
          )}
        </Section>

        <Section step={3} title="Payment">
          <div className="space-y-3">
            {paymentMethods.map((m) => (
              <label
                key={m.method}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[3px] border p-4 transition",
                  form.paymentMethod === m.method ? "border-gold bg-gold/5" : "border-border",
                )}
              >
                <input type="radio" name="paymentMethod" value={m.method} checked={form.paymentMethod === m.method} onChange={set("paymentMethod")} className="mt-1 accent-gold" />
                <span>
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-sm text-muted">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>
      </div>

      <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-36">
        <h2 className="text-2xl">Order review</h2>
        {!quote ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-gold" />
          </div>
        ) : (
          <>
            <ul className="max-h-72 space-y-4 overflow-y-auto pr-1">
              {quote.lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                    {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                    {l.quantity > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-fg text-[0.6rem] text-bg">{l.quantity}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{l.name || "Unavailable item"}</p>
                    {l.color && <p className="text-xs text-muted">{COLORS[l.color].label}</p>}
                    {l.kind === "giftbox" && <p className="text-xs text-gold">Gift Box</p>}
                    {l.issue && <p className="text-xs text-danger">{l.issue}</p>}
                  </div>
                  <span className="text-sm">{formatMoney(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <PromoCodeInput quote={quote} />
            <OrderTotals quote={quote} className={loading ? "opacity-60" : undefined} />
            {quote.issues.length > 0 && (
              <Alert tone="error">
                {quote.issues[0]}{" "}
                <Link href="/cart" className="underline">
                  Review bag
                </Link>
              </Alert>
            )}
          </>
        )}
        <Button type="submit" size="lg" className="w-full" loading={pending} disabled={blocked || pending}>
          <Lock className="size-3.5" /> Place order
        </Button>
        <p className="text-center text-xs text-muted">You&apos;ll pay {quote ? formatMoney(quote.total) : ""} in cash on delivery.</p>
      </aside>
    </form>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 text-2xl">
        <span className="flex size-7 items-center justify-center rounded-full border border-gold font-sans text-xs text-gold">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
