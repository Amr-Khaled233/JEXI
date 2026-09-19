"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createColorAction, deleteProductAction, saveProductAction, type ProductPayload } from "@/app/admin/actions/catalog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Panel } from "@/components/admin/ui";
import { ColorSwatch } from "@/components/color-swatch";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import type { ColorInfo, TagKey } from "@/lib/constants";
import { formatMoney, toMinor } from "@/lib/money";

export type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  /** Regular price (EGP). */
  price: string;
  /** Optional sale price (EGP). */
  salePrice: string;
  categoryIds: string[];
  tags: TagKey[];
  published: boolean;
  images: string[];
  /** colorId → stock */
  stock: Record<string, string>;
};

export function ProductForm({ initial, categories, colors: initialColors }: { initial: ProductFormValues; categories: { id: string; name: string }[]; colors: ColorInfo[] }) {
  const [v, setV] = useState(initial);
  const [colors, setColors] = useState(initialColors);
  const [newColor, setNewColor] = useState({ name: "", hex: "#c9a24a" });
  const [colorError, setColorError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, startAdding] = useTransition();
  const [deleting, startDelete] = useTransition();

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setV((s) => ({ ...s, [key]: value }));
  const toggleIn = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const regular = Number(v.price) || 0;
  const sale = v.salePrice.trim() ? Number(v.salePrice) : null;
  const saleValid = sale != null && sale > 0 && sale < regular;

  const addColor = () => {
    setColorError(null);
    startAdding(async () => {
      const res = await createColorAction(newColor);
      if (res.error || !res.color) {
        setColorError(res.error ?? "Couldn't add the color.");
        return;
      }
      setColors((c) => [...c, res.color!]);
      setV((s) => ({ ...s, stock: { ...s.stock, [res.color!.id]: "0" } }));
      setNewColor({ name: "", hex: "#c9a24a" });
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: ProductPayload = {
      name: v.name,
      description: v.description,
      price: Number(v.price),
      salePrice: v.salePrice.trim() ? Number(v.salePrice) : null,
      categoryIds: v.categoryIds,
      tags: v.tags,
      published: v.published,
      images: v.images,
      variants: Object.entries(v.stock).map(([colorId, stock]) => ({ colorId, stock: Math.max(0, Math.floor(Number(stock) || 0)) })),
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
      <div className="min-w-0 space-y-6">
        {error && <Alert tone="error">{error}</Alert>}
        <Panel title="Details">
          <div className="grid gap-4">
            <Field label="Name" htmlFor="name">
              <Input id="name" value={v.name} required onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Description" htmlFor="description">
              <Textarea id="description" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Images">
          <ImageUploader value={v.images} onChange={(images) => set("images", images)} hint={<><span className="font-medium text-fg">Best size: 1200 x 1500 px</span> (portrait, 4:5), the same shape as the product cards in the store. Smaller photos may look blurry. JPG, PNG or WebP, up to 8 MB. The first photo is the cover.</>} />
        </Panel>

        <Panel title="Colors & stock">
          <p className="mb-4 text-sm text-muted">Tick the colors this piece comes in and set the stock for each.</p>
          <div className="space-y-2.5">
            {colors.map((c) => {
              const enabled = c.id in v.stock;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-[3px] border border-border p-3">
                  <Checkbox
                    className="min-w-40 flex-1"
                    checked={enabled}
                    onChange={() => {
                      const next = { ...v.stock };
                      if (enabled) delete next[c.id];
                      else next[c.id] = "0";
                      set("stock", next);
                    }}
                    label={
                      <span className="inline-flex items-center gap-2">
                        <ColorSwatch hex={c.hex} className="size-5" /> {c.name}
                      </span>
                    }
                  />
                  {enabled && (
                    <label className="flex items-center gap-2 text-xs text-muted">
                      In stock
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${c.name} stock`}
                        value={v.stock[c.id]}
                        onChange={(e) => set("stock", { ...v.stock, [c.id]: e.target.value })}
                        className="h-10 w-24"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-[3px] border border-dashed border-border p-4">
            <p className="mb-3 text-xs tracking-[0.14em] text-muted uppercase">Add a new color</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={newColor.hex}
                onChange={(e) => setNewColor((c) => ({ ...c, hex: e.target.value }))}
                aria-label="Pick the color"
                className="size-11 cursor-pointer rounded-[3px] border border-border bg-surface p-1"
              />
              <Input
                placeholder="Color name, e.g. Champagne"
                value={newColor.name}
                onChange={(e) => setNewColor((c) => ({ ...c, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColor();
                  }
                }}
                className="h-11 min-w-0 flex-1"
              />
              <Button type="button" variant="outline" size="sm" className="h-11" loading={adding} onClick={addColor} disabled={!newColor.name.trim()}>
                <Plus className="size-3.5" /> Add color
              </Button>
            </div>
            {colorError && <p className="mt-2 text-xs text-danger">{colorError}</p>}
          </div>
          {v.id && <p className="mt-3 text-xs text-muted">Unticking a color removes it from this product (and from any gift box that uses it).</p>}
        </Panel>
      </div>

      <div className="min-w-0 space-y-6">
        <Panel title="Publishing">
          <Checkbox checked={v.published} onChange={(e) => set("published", e.target.checked)} label="Published (visible in the store)" />
        </Panel>
        <Panel title="Pricing (EGP)">
          <div className="grid gap-4">
            <Field label="Price" htmlFor="price">
              <Input id="price" type="number" min={0} step="0.01" required value={v.price} onChange={(e) => set("price", e.target.value)} />
            </Field>
            <Field
              label="Sale price (optional)"
              htmlFor="salePrice"
              hint="Leave empty when the piece isn't on sale."
              error={sale != null && !saleValid && regular > 0 ? "Must be lower than the price." : null}
            >
              <Input id="salePrice" type="number" min={0} step="0.01" value={v.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
            </Field>
          </div>
          {regular > 0 && (
            <div className="mt-4 rounded-[3px] bg-surface-2 px-4 py-3 text-sm">
              {saleValid ? (
                <>
                  Customers pay <span className="font-medium text-gold">{formatMoney(toMinor(sale!))}</span>{" "}
                  <span className="text-muted line-through">{formatMoney(toMinor(regular))}</span>
                  <span className="block text-xs text-muted">
                    Saving {formatMoney(toMinor(regular - sale!))} ({Math.round(((regular - sale!) / regular) * 100)}%). Shown with a Sale badge.
                  </span>
                </>
              ) : (
                <>
                  Customers pay <span className="font-medium">{formatMoney(toMinor(regular))}</span>
                </>
              )}
            </div>
          )}
        </Panel>
        <Panel title="Tags">
          <div className="flex flex-col gap-2.5">
            <Checkbox checked={v.tags.includes("BEST_SELLER")} onChange={() => set("tags", toggleIn(v.tags, "BEST_SELLER" as TagKey))} label="Best Seller" />
            <Checkbox checked={v.tags.includes("NEW")} onChange={() => set("tags", toggleIn(v.tags, "NEW" as TagKey))} label="New" />
            <p className="text-xs text-muted">The Sale badge is added automatically when a sale price is set.</p>
          </div>
        </Panel>
        <Panel title="Categories">
          <div className="flex flex-col gap-2.5">
            {categories.length === 0 && <p className="text-sm text-muted">No categories yet.</p>}
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
