"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { toggleShippingZoneAction, updateShippingZoneAction } from "@/app/admin/actions/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Zone = { id: string; name: string; enabled: boolean; fee: string; estimatedDelivery: string };

export function ShippingZoneRow({ zone }: { zone: Zone }) {
  const [state, action, pending] = useActionState(updateShippingZoneAction, undefined);
  const [enabled, setEnabled] = useOptimistic(zone.enabled);
  const [, startTransition] = useTransition();

  return (
    <form action={action} className={cn("grid items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_7rem_10rem_12rem_5rem]", !enabled && "opacity-60")}>
      <input type="hidden" name="id" value={zone.id} />
      <input type="hidden" name="enabled" value={enabled ? "on" : ""} />
      <span className="font-medium">{zone.name}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`Show ${zone.name} at checkout`}
        onClick={() =>
          startTransition(async () => {
            setEnabled(!enabled);
            await toggleShippingZoneAction(zone.id, !enabled);
          })
        }
        className={cn("relative h-6 w-11 rounded-full transition", enabled ? "bg-gold" : "bg-border")}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", enabled ? "left-5.5" : "left-0.5")} />
      </button>
      <Input name="fee" type="number" min={0} step="0.01" placeholder="Default" defaultValue={zone.fee} className="h-9" aria-label={`${zone.name} fee`} />
      <Input name="estimatedDelivery" placeholder="e.g. 2–4 business days" defaultValue={zone.estimatedDelivery} className="h-9" aria-label={`${zone.name} delivery estimate`} />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline" size="sm" className="h-9 px-3" loading={pending}>
          Save
        </Button>
        {state?.success && !pending && <span className="text-xs text-success">✓</span>}
        {state?.error && <span className="text-xs text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
