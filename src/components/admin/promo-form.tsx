"use client";

import { useState, useTransition } from "react";
import { deletePromoCodeAction, savePromoCodeAction } from "@/app/admin/actions/store";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input, Select } from "@/components/ui/field";

export type PromoFormValues = {
  id?: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  usageLimit: string;
  perCustomerLimit: string;
  minOrderValue: string;
  scope: "ALL" | "CATEGORY" | "PRODUCTS";
  categoryIds: string[];
  productIds: string[];
  active: boolean;
  usedCount?: number;
};

/** ISO → value for <input type="datetime-local"> in the admin's local time zone. */
function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function PromoForm({
  initial,
  categories,
  products,
}: {
  initial: PromoFormValues;
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const set = <K extends keyof PromoFormValues>(k: K, val: PromoFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const toggle = (key: "categoryIds" | "productIds", id: string) =>
    set(key, v[key].includes(id) ? v[key].filter((x) => x !== id) : [...v[key], id]);
  const intOrNull = (s: string) => (s.trim() ? Math.floor(Number(s)) : null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await savePromoCodeAction(v.id ?? null, {
        code: v.code,
        description: v.description,
        discountType: v.discountType,
        value: Number(v.value),
        startsAt: v.startsAt,
        endsAt: v.endsAt,
        usageLimit: intOrNull(v.usageLimit),
        perCustomerLimit: intOrNull(v.perCustomerLimit),
        minOrderValue: v.minOrderValue.trim() ? Number(v.minOrderValue) : null,
        scope: v.scope,
        categoryIds: v.categoryIds,
        productIds: v.productIds,
        active: v.active,
      });
      if (res?.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {error && <Alert tone="error">{error}</Alert>}
        <Panel title="Code">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="code" hint="Customers type this at checkout.">
              <Input id="code" required value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="tracking-wider uppercase" />
            </Field>
            <Field label="Internal description" htmlFor="description">
              <Input id="description" value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Discount type" htmlFor="discountType">
              <Select id="discountType" value={v.discountType} onChange={(e) => set("discountType", e.target.value as PromoFormValues["discountType"])}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed amount (EGP)</option>
              </Select>
            </Field>
            <Field label={v.discountType === "PERCENTAGE" ? "Percent off" : "Amount off (EGP)"} htmlFor="value">
              <Input id="value" type="number" min={0} step={v.discountType === "PERCENTAGE" ? 1 : 0.01} max={v.discountType === "PERCENTAGE" ? 100 : undefined} required value={v.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Validity period">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" htmlFor="startsAt">
              <Input id="startsAt" type="datetime-local" required value={toLocalInput(v.startsAt)} onChange={(e) => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : "")} />
            </Field>
            <Field label="Ends" htmlFor="endsAt">
              <Input id="endsAt" type="datetime-local" required value={toLocalInput(v.endsAt)} onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : "")} />
            </Field>
          </div>
        </Panel>

        <Panel title="Applies to">
          <div className="flex flex-wrap gap-4">
            {(["ALL", "CATEGORY", "PRODUCTS"] as const).map((s) => (
              <label key={s} className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="scope" checked={v.scope === s} onChange={() => set("scope", s)} className="accent-gold" />
                {s === "ALL" ? "Entire order (incl. gift boxes)" : s === "CATEGORY" ? "Specific categories" : "Specific products"}
              </label>
            ))}
          </div>
          {v.scope === "CATEGORY" && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {categories.map((c) => (
                <Checkbox key={c.id} checked={v.categoryIds.includes(c.id)} onChange={() => toggle("categoryIds", c.id)} label={c.name} />
              ))}
            </div>
          )}
          {v.scope === "PRODUCTS" && (
            <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {products.map((p) => (
                <Checkbox key={p.id} checked={v.productIds.includes(p.id)} onChange={() => toggle("productIds", p.id)} label={p.name} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Limits">
          <div className="grid gap-4">
            <Field label="Total usage limit" htmlFor="usageLimit" hint={v.usedCount != null ? `Used ${v.usedCount} times so far. Blank = unlimited.` : "Blank = unlimited."}>
              <Input id="usageLimit" type="number" min={1} value={v.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
            </Field>
            <Field label="Max uses per customer" htmlFor="perCustomerLimit" hint="Matched by email or phone. Blank = unlimited.">
              <Input id="perCustomerLimit" type="number" min={1} value={v.perCustomerLimit} onChange={(e) => set("perCustomerLimit", e.target.value)} />
            </Field>
            <Field label="Minimum order (EGP)" htmlFor="minOrderValue" hint="Optional.">
              <Input id="minOrderValue" type="number" min={0} step="0.01" value={v.minOrderValue} onChange={(e) => set("minOrderValue", e.target.value)} />
            </Field>
          </div>
        </Panel>
        <Panel title="Status">
          <Checkbox checked={v.active} onChange={(e) => set("active", e.target.checked)} label="Active" />
        </Panel>
        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" loading={pending}>
            {v.id ? "Save changes" : "Create code"}
          </Button>
          {v.id && (
            <Button
              type="button"
              variant="ghost"
              className="text-danger hover:text-danger"
              loading={deleting}
              onClick={() => confirm("Delete this promo code? Past orders keep their discount.") && startDelete(async () => await deletePromoCodeAction(v.id!))}
            >
              Delete code
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
