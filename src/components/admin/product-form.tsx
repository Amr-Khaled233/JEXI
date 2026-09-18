"use client";

import { useState, useTransition } from "react";
import { deleteProductAction, saveProductAction, type ProductPayload } from "@/app/admin/actions/catalog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Panel } from "@/components/admin/ui";
import { ColorSwatch } from "@/components/color-swatch";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { COLOR_KEYS, COLORS, TAG_KEYS, TAGS, type ColorKey, type TagKey } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryIds: string[];
  tags: TagKey[];
  published: boolean;
  images: string[];
  variants: Partial<Record<ColorKey, { stock: string; sku: string }>>;
};

export function ProductForm({ initial, categories }: { initial: ProductFormValues; categories: { id: string; name: string }[] }) {
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setV((s) => ({ ...s, [key]: value }));
  const toggleIn = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: ProductPayload = {
      name: v.name,
      slug: v.slug,
      sku: v.sku,
      description: v.description,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice.trim() ? Number(v.compareAtPrice) : null,
      categoryIds: v.categoryIds,
      tags: v.tags,
      published: v.published,
      images: v.images,
      variants: Object.entries(v.variants).map(([color, x]) => ({ color, stock: Math.max(0, Math.floor(Number(x!.stock) || 0)), sku: x!.sku || undefined })),
    };
    startTransition(async () => {
      const res = await saveProductAction(v.id ?? null, payload);
      if (res?.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {error && <Alert tone="error">{error}</Alert>}
        <Panel title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" className="sm:col-span-2">
              <Input
                id="name"
                value={v.name}
                required
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="URL slug" htmlFor="slug" hint={`/product/${v.slug || "…"}`}>
              <Input
                id="slug"
                value={v.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
              />
            </Field>
            <Field label="SKU" htmlFor="sku">
              <Input id="sku" value={v.sku} required onChange={(e) => set("sku", e.target.value)} className="uppercase" />
            </Field>
            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Textarea id="description" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Images">
          <ImageUploader value={v.images} onChange={(images) => set("images", images)} />
        </Panel>

        <Panel title="Colors & stock">
          <p className="mb-4 text-sm text-muted">Enable the colors this piece is offered in and set stock for each.</p>
          <div className="space-y-3">
            {COLOR_KEYS.map((color) => {
              const variant = v.variants[color];
              return (
                <div key={color} className="grid items-center gap-3 rounded-[3px] border border-border p-3 sm:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)]">
                  <Checkbox
                    checked={!!variant}
                    onChange={() => {
                      const next = { ...v.variants };
                      if (variant) delete next[color];
                      else next[color] = { stock: "0", sku: "" };
                      set("variants", next);
                    }}
                    label={
                      <span className="inline-flex items-center gap-2">
                        <ColorSwatch color={color} /> {COLORS[color].label}
                      </span>
                    }
                  />
                  {variant && (
                    <>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${COLORS[color].label} stock`}
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(e) => set("variants", { ...v.variants, [color]: { ...variant, stock: e.target.value } })}
                        className="h-10"
                      />
                      <Input
                        aria-label={`${COLORS[color].label} SKU`}
                        placeholder="Variant SKU (optional)"
                        value={variant.sku}
                        onChange={(e) => set("variants", { ...v.variants, [color]: { ...variant, sku: e.target.value } })}
                        className="h-10 uppercase"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {v.id && <p className="mt-3 text-xs text-muted">Disabling a color removes that variant (and any gift box items that use it).</p>}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Publishing">
          <Checkbox checked={v.published} onChange={(e) => set("published", e.target.checked)} label="Published (visible in the store)" />
        </Panel>
        <Panel title="Pricing (EGP)">
          <div className="grid gap-4">
            <Field label="Price" htmlFor="price">
              <Input id="price" type="number" min={0} step="0.01" required value={v.price} onChange={(e) => set("price", e.target.value)} />
            </Field>
            <Field label="Compare-at price" htmlFor="compare" hint="Optional original price, shown struck through when on sale.">
              <Input id="compare" type="number" min={0} step="0.01" value={v.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
            </Field>
          </div>
        </Panel>
        <Panel title="Tags">
          <div className="flex flex-col gap-2.5">
            {TAG_KEYS.map((t) => (
              <Checkbox key={t} checked={v.tags.includes(t)} onChange={() => set("tags", toggleIn(v.tags, t))} label={TAGS[t].label} />
            ))}
          </div>
        </Panel>
        <Panel title="Categories">
          <div className="flex flex-col gap-2.5">
            {categories.map((c) => (
              <Checkbox key={c.id} checked={v.categoryIds.includes(c.id)} onChange={() => set("categoryIds", toggleIn(v.categoryIds, c.id))} label={c.name} />
            ))}
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" loading={pending}>
            {v.id ? "Save changes" : "Create product"}
          </Button>
          {v.id && (
            <Button
              type="button"
              variant="ghost"
              className="text-danger hover:text-danger"
              loading={deleting}
              onClick={() => {
                if (confirm("Delete this product permanently? Consider unpublishing instead. Past orders keep their details.")) {
                  startDelete(async () => {
                    await deleteProductAction(v.id!);
                  });
                }
              }}
            >
              Delete product
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
