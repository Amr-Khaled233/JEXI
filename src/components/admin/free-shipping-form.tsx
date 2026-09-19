"use client";

import { useState, useTransition } from "react";
import { saveFreeShippingAction } from "@/app/admin/actions/store";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input } from "@/components/ui/field";
import { formatMoney, toMinor } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";

export type FreeShippingValues = {
  enabled: boolean;
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO
  minimum: string; // EGP
};

/** ISO → value for <input type="datetime-local"> in the admin's time zone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function FreeShippingForm({ initial }: { initial: FreeShippingValues }) {
  const [v, setV] = useState(initial);
  const [useDates, setUseDates] = useState(!!(initial.startsAt || initial.endsAt));
  const [useMinimum, setUseMinimum] = useState(!!initial.minimum);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof FreeShippingValues>(k: K, val: FreeShippingValues[K]) => setV((s) => ({ ...s, [k]: val }));

  // Live summary of what customers get.
  const now = new Date();
  const starts = useDates && v.startsAt ? new Date(v.startsAt) : null;
  const ends = useDates && v.endsAt ? new Date(v.endsAt) : null;
  const min = useMinimum && Number(v.minimum) > 0 ? toMinor(Number(v.minimum)) : null;
  let status: { label: string; tone: "on" | "soon" | "off"; text: string };
  if (!v.enabled) status = { label: "Off", tone: "off", text: "Every order pays its governorate's shipping fee from Shipping Zones." };
  else if (starts && now < starts) status = { label: "Scheduled", tone: "soon", text: `Starts ${formatDate(starts, true)}.` };
  else if (ends && now > ends) status = { label: "Ended", tone: "off", text: `Ended ${formatDate(ends, true)}. Orders pay shipping again.` };
  else
    status = {
      label: "Running now",
      tone: "on",
      text: `${min ? `Orders over ${formatMoney(min)}` : "All orders"} ship free${ends ? ` until ${formatDate(ends, true)}` : ""}.${min ? " Smaller orders pay their governorate's shipping fee." : ""}`,
    };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveFreeShippingAction({
        enabled: v.enabled,
        startsAt: useDates && v.startsAt ? v.startsAt : null,
        endsAt: useDates && v.endsAt ? v.endsAt : null,
        minimum: useMinimum && v.minimum.trim() ? Number(v.minimum) : null,
      });
      setMessage(res?.error ? { tone: "error", text: res.error } : { tone: "success", text: res?.success ?? "Saved." });
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl">Free shipping</h2>
              <p className="mt-1 text-sm text-muted">Turn the offer on or off for the whole store.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={v.enabled}
              aria-label="Free shipping on or off"
              onClick={() => set("enabled", !v.enabled)}
              className={cn("relative h-7 w-13 shrink-0 rounded-full transition", v.enabled ? "bg-gold" : "bg-border")}
            >
              <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", v.enabled ? "left-6.5" : "left-0.5")} />
            </button>
          </div>
        </Panel>

        <Panel title="When">
          <Checkbox checked={useDates} onChange={(e) => setUseDates(e.target.checked)} label="Only between specific dates" />
          {useDates && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Starts" htmlFor="startsAt" hint="Leave empty to start now.">
                <Input id="startsAt" type="datetime-local" value={toLocalInput(v.startsAt)} onChange={(e) => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </Field>
              <Field label="Ends" htmlFor="endsAt" hint="Leave empty to keep it running.">
                <Input id="endsAt" type="datetime-local" value={toLocalInput(v.endsAt)} onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </Field>
            </div>
          )}
          {!useDates && <p className="mt-2 text-sm text-muted">Runs until you turn it off.</p>}
        </Panel>

        <Panel title="Which orders">
          <Checkbox checked={useMinimum} onChange={(e) => setUseMinimum(e.target.checked)} label="Only for orders over a minimum amount" />
          {useMinimum ? (
            <Field label="Minimum order (EGP)" htmlFor="minimum" hint="Measured after any promo-code discount." className="mt-4 max-w-xs">
              <Input id="minimum" type="number" min={0} step="0.01" value={v.minimum} onChange={(e) => set("minimum", e.target.value)} />
            </Field>
          ) : (
            <p className="mt-2 text-sm text-muted">Every order ships free while the offer runs.</p>
          )}
        </Panel>
      </div>

      <div className="min-w-0 space-y-6">
        <Panel title="Right now">
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-medium tracking-[0.14em] uppercase",
              status.tone === "on" && "bg-success/15 text-success",
              status.tone === "soon" && "bg-warning/15 text-warning",
              status.tone === "off" && "bg-surface-2 text-muted",
            )}
          >
            {status.label}
          </span>
          <p className="mt-3 text-sm leading-relaxed">{status.text}</p>
        </Panel>

        <Panel title="Shipping fees">
          <p className="text-sm leading-relaxed text-muted">
            Orders that don&apos;t get free shipping pay the fee you set for their governorate in{" "}
            <a href="/admin/shipping" className="text-gold underline underline-offset-2">
              Shipping Zones
            </a>
            . A governorate with no fee ships free.
          </p>
        </Panel>

        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
