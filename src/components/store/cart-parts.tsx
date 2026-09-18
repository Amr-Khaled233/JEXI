"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { COLORS } from "@/lib/constants";
import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/money";
import type { Quote, QuoteLine } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function CartLines({ quote, compact, onNavigate }: { quote: Quote; compact?: boolean; onNavigate?: () => void }) {
  return (
    <ul className="divide-y divide-border">
      {quote.lines.map((line) => (
        <CartLineRow key={line.key} line={line} compact={compact} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}

function CartLineRow({ line, compact, onNavigate }: { line: QuoteLine; compact?: boolean; onNavigate?: () => void }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  if (!line.name) {
    return (
      <li className="flex items-center justify-between gap-3 py-4 text-sm text-muted">
        <span>{line.issue}</span>
        <button type="button" onClick={() => remove(line.key)} className="text-xs underline hover:text-gold">
          Remove
        </button>
      </li>
    );
  }

  return (
    <li className="flex gap-4 py-4">
      <Link href={line.href} onClick={onNavigate} className="relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-[3px] bg-surface-2 sm:w-24">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={line.href} onClick={onNavigate} className="block font-serif text-lg leading-tight hover:text-gold">
              {line.name}
            </Link>
            {line.color && <p className="mt-0.5 text-xs text-muted">{COLORS[line.color].label}</p>}
            {line.kind === "giftbox" && <p className="mt-0.5 text-xs text-gold">Gift Box · {line.contents?.length} pieces</p>}
          </div>
          <button type="button" onClick={() => remove(line.key)} aria-label={`Remove ${line.name}`} className="p-1 text-muted hover:text-danger">
            {compact ? <X className="size-4" /> : <Trash2 className="size-4" strokeWidth={1.5} />}
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <QuantityStepper
            value={line.quantity}
            max={Math.max(line.maxQuantity, 1)}
            onChange={(q) => setQuantity(line.key, q)}
            disabled={!line.available}
          />
          <div className="text-right">
            <p className="text-sm font-medium">{formatMoney(line.lineTotal)}</p>
            {line.compareAtPrice && <p className="text-xs text-muted line-through">{formatMoney(line.compareAtPrice * line.quantity)}</p>}
          </div>
        </div>
        {line.issue && <p className="mt-2 text-xs text-danger">{line.issue}</p>}
      </div>
    </li>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  size = "sm",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const btn = cn("flex items-center justify-center transition hover:text-gold disabled:opacity-30", size === "sm" ? "size-8" : "size-11");
  return (
    <div className={cn("inline-flex items-center rounded-[3px] border border-border", disabled && "opacity-50")}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={disabled} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span className={cn("min-w-7 text-center tabular-nums", size === "sm" ? "text-sm" : "text-base")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function PromoCodeInput({ quote }: { quote: Quote | null }) {
  const promoCode = useCart((s) => s.promoCode);
  const setPromoCode = useCart((s) => s.setPromoCode);
  const [value, setValue] = useState("");
  const promo = quote?.promo;

  if (promoCode) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-[3px] border border-dashed border-gold/60 px-3 py-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-wider">
            <Tag className="size-3.5 text-gold" /> {promoCode}
          </span>
          <button type="button" onClick={() => setPromoCode(null)} className="text-xs text-muted underline hover:text-gold">
            Remove
          </button>
        </div>
        {promo && promo.code === promoCode && (
          <p className={cn("text-xs", promo.applied ? "text-success" : "text-danger")}>{promo.message}</p>
        )}
      </div>
    );
  }

  // Not a <form>: this sits inside the checkout form, and forms can't be nested.
  const apply = () => {
    if (value.trim()) setPromoCode(value);
    setValue("");
  };
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="Promo code"
        aria-label="Promo code"
        className="h-10 min-w-0 uppercase tracking-wider"
        autoComplete="off"
      />
      <Button type="button" variant="outline" size="sm" className="h-10 shrink-0" onClick={apply}>
        Apply
      </Button>
    </div>
  );
}

export function OrderTotals({ quote, className }: { quote: Quote; className?: string }) {
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatMoney(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>Discount{quote.promo?.code ? ` (${quote.promo.code})` : ""}</dt>
          <dd>− {formatMoney(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Shipping</dt>
        <dd className={cn(quote.shipping.free && "text-gold", !quote.shipping.available && "text-danger")}>{quote.shipping.label}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
        <dt>Total</dt>
        <dd>{formatMoney(quote.total)}</dd>
      </div>
    </dl>
  );
}
