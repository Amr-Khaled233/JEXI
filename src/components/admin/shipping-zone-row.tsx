"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { toggleShippingZoneAction, updateShippingZoneAction } from "@/app/admin/actions/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Zone = { id: string; name: string; enabled: boolean; fee: string; estimatedDelivery: string };

/** One table row. The inputs belong to the row's <form> (in the last cell) via the form attribute. */
export function ShippingZoneRow({ zone }: { zone: Zone }) {
  const [state, action, pending] = useActionState(updateShippingZoneAction, undefined);
  const [enabled, setEnabled] = useOptimistic(zone.enabled);
  const [, startTransition] = useTransition();
  const formId = `zone-${zone.id}`;

  return (
    <tr className={cn(!enabled && "opacity-60")}>
      <td className="font-medium">{zone.name}</td>
      <td>
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
      </td>
      <td>
        <Input form={formId} name="fee" type="number" min={0} step="0.01" placeholder="Free" defaultValue={zone.fee} className="h-9 w-28" aria-label={`${zone.name} fee`} />
      </td>
      <td>
        <Input form={formId} name="estimatedDelivery" placeholder="e.g. 2 to 4 business days" defaultValue={zone.estimatedDelivery} className="h-9 min-w-44" aria-label={`${zone.name} delivery estimate`} />
      </td>
      <td>
        <form id={formId} action={action} className="flex items-center gap-2">
          <input type="hidden" name="id" value={zone.id} />
          <input type="hidden" name="enabled" value={enabled ? "on" : ""} />
          <Button type="submit" variant="outline" size="sm" className="h-9 px-3" loading={pending}>
            Save
          </Button>
          {state?.success && !pending && <span className="text-xs text-success">Saved</span>}
          {state?.error && <span className="text-xs text-danger">{state.error}</span>}
        </form>
      </td>
    </tr>
  );
}
