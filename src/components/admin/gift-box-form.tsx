"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { deleteGiftBoxAction, saveGiftBoxAction } from "@/app/admin/actions/catalog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { COLORS, type ColorKey } from "@/lib/constants";
import { formatMoney, toMinor } from "@/lib/money";
import { slugify } from "@/lib/utils";

type ProductOption = { id: string; name: string; price: number; variants: { id: string; color: ColorKey; stock: number }[] };
type Item = { productId: string; variantId: string; quantity: number };

export type GiftBoxFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  price: string;
  published: boolean;
  items: Item[];
};

export function GiftBoxForm({ initial, products }: { initial: GiftBoxFormValues; products: ProductOption[] }) {
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const byId = new Map(products.map((p) => [p.id, p]));

  const set = <K extends keyof GiftBoxFormValues>(key: K, value: GiftBoxFormValues[K]) => setV((s) => ({ ...s, [key]: value }));
  const setItem = (i: number, patch: Partial<Item>) => set("items", v.items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const separate = v.items.reduce((sum, it) => sum + (byId.get(it.productId)?.price ?? 0) * it.quantity, 0);
  const bundle = v.price ? toMinor(Number(v.price)) : 0;
  const savings = separate - bundle;
  const stock = v.items.length
    ? Math.min(
        ...v.items.map((it) => {
          const variant = byId.get(it.productId)?.variants.find((x) => x.id === it.variantId);
          return variant ? Math.floor(variant.stock / it.quantity) : 0;
        }),
      )
    : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveGiftBoxAction(v.id ?? null, {
        name: v.name,
        slug: v.slug,
        description: v.description,
        coverImage: v.coverImage,
        price: Number(v.price),
        published: v.published,
        items: v.items,
      });
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
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                required
                value={v.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="URL slug" htmlFor="slug" hint={`/gift-boxes/${v.slug || "…"}`}>
              <Input
                id="slug"
                value={v.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
              />
            </Field>
            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Textarea id="description" rows={4} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Items in this box"
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => set("items", [...v.items, { productId: "", variantId: "", quantity: 1 }])}>
              <Plus className="size-3.5" /> Add item
            </Button>
          }
        >
          {v.items.length === 0 && <p className="text-sm text-muted">Add at least two products to build the bundle.</p>}
          <div className="space-y-3">
            {v.items.map((it, i) => {
              const product = byId.get(it.productId);
              return (
                <div key={i} className="grid gap-2 rounded-[3px] border border-border p-3 sm:grid-cols-[minmax(0,1fr)_11rem_5rem_auto]">
                  <Select
                    aria-label="Product"
                    value={it.productId}
                    onChange={(e) => {
                      const p = byId.get(e.target.value);
                      setItem(i, { productId: e.target.value, variantId: p?.variants[0]?.id ?? "" });
                    }}
                    className="h-10"
                  >
                    <option value="" disabled>
                      Choose a product
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}, {formatMoney(p.price)}
                      </option>
                    ))}
                  </Select>
                  <Select aria-label="Color" value={it.variantId} onChange={(e) => setItem(i, { variantId: e.target.value })} className="h-10" disabled={!product}>
                    {product?.variants.map((x) => (
                      <option key={x.id} value={x.id}>
                        {COLORS[x.color].label} ({x.stock})
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    aria-label="Quantity"
                    value={it.quantity}
                    onChange={(e) => setItem(i, { quantity: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
                    className="h-10"
                  />
                  <button type="button" onClick={() => set("items", v.items.filter((_, j) => j !== i))} className="p-2 text-muted hover:text-danger" aria-label="Remove item">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Cover image">
          <ImageUploader value={v.coverImage ? [v.coverImage] : []} onChange={(imgs) => set("coverImage", imgs[0] ?? "")} max={1} />
        </Panel>
        <Panel title="Pricing (EGP)">
          <Field label="Bundle price" htmlFor="price">
            <Input id="price" type="number" min={0} step="0.01" required value={v.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Bought separately</dt>
              <dd>{formatMoney(separate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Customer saves</dt>
              <dd className={savings > 0 ? "text-success" : savings < 0 ? "text-danger" : ""}>
                {savings > 0 ? `${formatMoney(savings)} (${Math.round((savings / separate) * 100)}%)` : savings < 0 ? `Costs ${formatMoney(-savings)} more` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Boxes available</dt>
              <dd>{stock}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Publishing">
          <Checkbox checked={v.published} onChange={(e) => set("published", e.target.checked)} label="Published (visible in the store)" />
        </Panel>
        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" loading={pending}>
            {v.id ? "Save changes" : "Create gift box"}
          </Button>
          {v.id && (
            <Button
              type="button"
              variant="ghost"
              className="text-danger hover:text-danger"
              loading={deleting}
              onClick={() => confirm("Delete this gift box?") && startDelete(async () => void (await deleteGiftBoxAction(v.id!)))}
            >
              Delete gift box
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
