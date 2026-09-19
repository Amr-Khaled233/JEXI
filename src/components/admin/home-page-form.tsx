"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ExternalLink, X } from "lucide-react";
import { saveHomePageAction, type HomePayload } from "@/app/admin/actions/home";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type ProductOption = { id: string; name: string; image: string | null; published: boolean };
type Option = { id: string; name: string };

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-13 shrink-0 rounded-full transition", checked ? "bg-gold" : "bg-border")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", checked ? "left-6.5" : "left-0.5")} />
    </button>
  );
}

/** A home page section with an on/off switch; its settings show only while it's on. */
function Section({ title, description, shown, onShown, children }: { title: string; description: string; shown: boolean; onShown: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Switch checked={shown} onChange={onShown} label={`Show ${title}`} />
      </div>
      {shown && children && <div className="mt-5 border-t border-border pt-5">{children}</div>}
    </Panel>
  );
}

/** Choose products for a row: automatic (by tag) or hand-picked in a set order. */
function ProductPicker({ ids, onChange, products, autoLabel }: { ids: string[]; onChange: (ids: string[]) => void; products: ProductOption[]; autoLabel: string }) {
  const [manual, setManual] = useState(ids.length > 0);
  const byId = new Map(products.map((p) => [p.id, p]));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...ids];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-5">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" checked={!manual} onChange={() => { setManual(false); onChange([]); }} className="accent-gold" />
          {autoLabel}
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" checked={manual} onChange={() => setManual(true)} className="accent-gold" />
          Choose the products myself
        </label>
      </div>

      {manual && (
        <>
          <ol className="space-y-2">
            {ids.map((id, i) => {
              const p = byId.get(id);
              if (!p) return null;
              return (
                <li key={id} className="flex items-center gap-3 rounded-md border border-border bg-surface-2/40 p-2">
                  <span className="w-5 text-center text-xs text-muted tabular-nums">{i + 1}</span>
                  <span className="relative aspect-4/5 w-10 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                    {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {p.name}
                    {!p.published && <span className="ml-2 text-xs text-warning">(draft, hidden)</span>}
                  </span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded p-1.5 text-muted hover:text-gold disabled:opacity-25">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === ids.length - 1} aria-label="Move down" className="rounded p-1.5 text-muted hover:text-gold disabled:opacity-25">
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} aria-label={`Remove ${p.name}`} className="rounded p-1.5 text-muted hover:text-danger">
                    <X className="size-4" />
                  </button>
                </li>
              );
            })}
          </ol>
          {ids.length < 8 ? (
            <Select
              value=""
              onChange={(e) => e.target.value && onChange([...ids, e.target.value])}
              aria-label="Add a product"
              className="h-10"
            >
              <option value="">Add a product ({ids.length}/8)</option>
              {products
                .filter((p) => !ids.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.published ? "" : " (draft)"}
                  </option>
                ))}
            </Select>
          ) : (
            <p className="text-xs text-muted">Up to 8 products per row.</p>
          )}
          {ids.length === 0 && <p className="text-xs text-warning">No products chosen yet, so the row will show the automatic products.</p>}
        </>
      )}
    </div>
  );
}

export function HomePageForm({
  initial,
  products,
  giftBoxes,
  linkSuggestions,
}: {
  initial: HomePayload;
  products: ProductOption[];
  giftBoxes: Option[];
  linkSuggestions: { href: string; label: string }[];
}) {
  const [v, setV] = useState(initial);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof HomePayload>(k: K, val: HomePayload[K]) => setV((s) => ({ ...s, [k]: val }));

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveHomePageAction(v);
      setMessage(res.error ? { tone: "error", text: res.error } : { tone: "success", text: res.success ?? "Saved." });
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <datalist id="site-links">
          {linkSuggestions.map((l) => (
            <option key={l.href} value={l.href}>
              {l.label}
            </option>
          ))}
        </datalist>

        <Panel title="Hero (top of the page)">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
            <div>
              <p className="mb-1.5 text-xs font-medium tracking-[0.14em] text-muted uppercase">Photo</p>
              <ImageUploader
                value={v.heroImage ? [v.heroImage] : []}
                onChange={(imgs) => set("heroImage", imgs[0] ?? null)}
                max={1}
                hint={
                  <>
                    <span className="font-medium text-fg">Best size: 1600 x 1600 px</span> (square). Leave it empty to use the JEXI logo photo.
                  </>
                }
              />
            </div>
            <div className="grid content-start gap-4">
              <Field label="Tagline" htmlFor="heroTagline" hint="Leave empty to hide it.">
                <Input id="heroTagline" value={v.heroTagline} onChange={(e) => set("heroTagline", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First button text" htmlFor="p-label">
                  <Input id="p-label" value={v.heroPrimaryLabel} onChange={(e) => set("heroPrimaryLabel", e.target.value)} />
                </Field>
                <Field label="First button link" htmlFor="p-href">
                  <Input id="p-href" list="site-links" value={v.heroPrimaryHref} onChange={(e) => set("heroPrimaryHref", e.target.value)} placeholder="/shop" />
                </Field>
                <Field label="Second button text" htmlFor="s-label" hint="Leave empty to hide it.">
                  <Input id="s-label" value={v.heroSecondaryLabel} onChange={(e) => set("heroSecondaryLabel", e.target.value)} />
                </Field>
                <Field label="Second button link" htmlFor="s-href">
                  <Input id="s-href" list="site-links" value={v.heroSecondaryHref} onChange={(e) => set("heroSecondaryHref", e.target.value)} placeholder="/gift-boxes" />
                </Field>
              </div>
            </div>
          </div>
        </Panel>

        <Section title="Categories" description="The round category shortcuts under the hero." shown={v.showCategories} onShown={(x) => set("showCategories", x)} />

        <Section title="Best Sellers" description="A row of up to 8 products." shown={v.showBestSellers} onShown={(x) => set("showBestSellers", x)}>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Field label="Small title" htmlFor="bs-eyebrow">
              <Input id="bs-eyebrow" value={v.bestSellersEyebrow} onChange={(e) => set("bestSellersEyebrow", e.target.value)} />
            </Field>
            <Field label="Title" htmlFor="bs-title">
              <Input id="bs-title" value={v.bestSellersTitle} onChange={(e) => set("bestSellersTitle", e.target.value)} />
            </Field>
          </div>
          <ProductPicker ids={v.bestSellerIds} onChange={(ids) => set("bestSellerIds", ids)} products={products} autoLabel="Products tagged Best Seller" />
        </Section>

        <Section title="Featured gift box" description="The large gift box banner." shown={v.showGiftBox} onShown={(x) => set("showGiftBox", x)}>
          <Field label="Gift box" htmlFor="giftbox">
            <Select id="giftbox" value={v.featuredGiftBoxId ?? ""} onChange={(e) => set("featuredGiftBoxId", e.target.value || null)}>
              <option value="">The best-selling gift box</option>
              {giftBoxes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </Section>

        <Section title="New Arrivals" description="A second row of up to 8 products." shown={v.showNewArrivals} onShown={(x) => set("showNewArrivals", x)}>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Field label="Small title" htmlFor="na-eyebrow">
              <Input id="na-eyebrow" value={v.newArrivalsEyebrow} onChange={(e) => set("newArrivalsEyebrow", e.target.value)} />
            </Field>
            <Field label="Title" htmlFor="na-title">
              <Input id="na-title" value={v.newArrivalsTitle} onChange={(e) => set("newArrivalsTitle", e.target.value)} />
            </Field>
          </div>
          <ProductPicker ids={v.newArrivalIds} onChange={(ids) => set("newArrivalIds", ids)} products={products} autoLabel="Products tagged New" />
        </Section>

        <Section title="Store promises" description="The strip with Free shipping, Cash on delivery, Gift ready and Easy support." shown={v.showPromises} onShown={(x) => set("showPromises", x)} />
      </div>

      <aside className="min-w-0">
        <div className="space-y-4 lg:sticky lg:top-8">
          <Panel title="Publish">
            <p className="mb-4 text-sm text-muted">Changes go live on the home page as soon as you save.</p>
            {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}
            <Button type="button" size="lg" className="w-full" loading={pending} onClick={save}>
              Save home page
            </Button>
            <a href="/" target="_blank" className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
              View home page <ExternalLink className="size-3.5" />
            </a>
          </Panel>
        </div>
      </aside>
    </div>
  );
}
