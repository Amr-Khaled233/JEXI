"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/field";
import { ORDER_STATUS_KEYS, ORDER_STATUSES } from "@/lib/constants";

export function OrdersToolbar({ count }: { count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const go = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? p.set(k, v) : p.delete(k));
    p.delete("page");
    router.push(`${pathname}${p.size ? `?${p}` : ""}`);
  };

  // Search as you type (debounced).
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => go({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order number, name, email or phone"
          aria-label="Search orders"
          className="h-11 w-full rounded-[3px] border border-border bg-surface pr-3.5 pl-10 text-sm text-fg placeholder:text-muted/70 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-3">
        <Select value={params.get("status") ?? ""} onChange={(e) => go({ status: e.target.value || null })} aria-label="Filter by status" className="h-11 w-full sm:w-44">
          <option value="">All statuses</option>
          {ORDER_STATUS_KEYS.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUSES[s].label}
            </option>
          ))}
        </Select>
        <span className="shrink-0 text-sm text-muted tabular-nums">
          {count} {count === 1 ? "order" : "orders"}
        </span>
      </div>
    </div>
  );
}
