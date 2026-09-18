"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ColorSwatch } from "@/components/color-swatch";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { COLOR_KEYS, COLORS, TAG_KEYS, TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string };

const SORTS: Record<string, string> = {
  featured: "Featured",
  newest: "Newest",
  "best-selling": "Best selling",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  const toggle = (key: string, value: string) =>
    update((p) => {
      const values = new Set((p.get(key) ?? "").split(",").filter(Boolean));
      if (values.has(value)) values.delete(value);
      else values.add(value);
      if (values.size) p.set(key, [...values].join(","));
      else p.delete(key);
    });

  const has = (key: string, value: string) => (params.get(key) ?? "").split(",").includes(value);

  return { params, update, toggle, has, pending };
}

export function SortSelect() {
  const { params, update } = useFilterNav();
  return (
    <Select
      aria-label="Sort products"
      className="h-10 w-auto min-w-44 text-xs tracking-wider"
      value={params.get("sort") ?? "featured"}
      onChange={(e) => update((p) => (e.target.value === "featured" ? p.delete("sort") : p.set("sort", e.target.value)))}
    >
      {Object.entries(SORTS).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </Select>
  );
}

export function FilterPanel({ categories }: { categories?: Category[] }) {
  const { params, update, toggle, has, pending } = useFilterNav();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  useEffect(() => {
    setMin(params.get("min") ?? "");
    setMax(params.get("max") ?? "");
  }, [params]);

  const activeCount = ["category", "color", "tag", "min", "max", "q"].filter((k) => params.get(k)).length;

  return (
    <div className={cn("space-y-8 transition-opacity", pending && "opacity-60")}>
      {params.get("q") && (
        <FilterGroup title="Search">
          <button
            type="button"
            onClick={() => update((p) => p.delete("q"))}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm hover:text-gold"
          >
            “{params.get("q")}” <X className="size-3.5" />
          </button>
        </FilterGroup>
      )}

      {categories && categories.length > 0 && (
        <FilterGroup title="Category">
          {categories.map((c) => (
            <Checkbox key={c.slug} label={c.name} checked={has("category", c.slug)} onChange={() => toggle("category", c.slug)} />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Color">
        {COLOR_KEYS.map((c) => (
          <Checkbox
            key={c}
            checked={has("color", c)}
            onChange={() => toggle("color", c)}
            label={
              <span className="inline-flex items-center gap-2">
                <ColorSwatch color={c} /> {COLORS[c].label}
              </span>
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price (EGP)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              if (min) p.set("min", min);
              else p.delete("min");
              if (max) p.set("max", max);
              else p.delete("max");
            });
          }}
        >
          <Input type="number" inputMode="numeric" min={0} placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} className="h-9" aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <Input type="number" inputMode="numeric" min={0} placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} className="h-9" aria-label="Maximum price" />
          <Button type="submit" variant="outline" size="sm" className="h-9 px-3">
            Go
          </Button>
        </form>
      </FilterGroup>

      <FilterGroup title="Collection">
        {TAG_KEYS.map((t) => (
          <Checkbox key={t} label={TAGS[t].label} checked={has("tag", t)} onChange={() => toggle("tag", t)} />
        ))}
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => update((p) => ["category", "color", "tag", "min", "max", "q"].forEach((k) => p.delete(k)))}
          className="text-xs tracking-[0.18em] text-muted uppercase underline underline-offset-4 hover:text-gold"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[0.68rem] tracking-[0.24em] text-gold uppercase">{title}</legend>
      <div className="flex flex-col gap-2.5">{children}</div>
    </fieldset>
  );
}

export function MobileFilters({ categories }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  const count = ["category", "color", "tag", "min", "max"].filter((k) => params.get(k)).length;

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-10 lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-3.5" /> Filter{count ? ` (${count})` : ""}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="animate-fade-in absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
          <div className="animate-slide-in-left absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-bg">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-serif text-2xl">Filter</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="p-2 hover:text-gold">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <FilterPanel categories={categories} />
            </div>
            <div className="border-t border-border p-4">
              <Button type="button" className="w-full" onClick={() => setOpen(false)}>
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
