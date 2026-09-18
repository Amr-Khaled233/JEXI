"use client";

import { Trash2 } from "lucide-react";
import { deleteOrderAction } from "@/app/admin/actions/orders";
import { Button } from "@/components/ui/button";

export function DeleteOrderButton({ orderId, orderNumber, open, redirectToList, compact }: { orderId: string; orderNumber: string; open: boolean; redirectToList?: boolean; compact?: boolean }) {
  return (
    <form
      action={deleteOrderAction}
      onSubmit={(e) => {
        const note = open ? " Its items will go back into stock." : "";
        if (!confirm(`Delete order ${orderNumber} permanently?${note} This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={orderId} />
      {redirectToList && <input type="hidden" name="redirect" value="list" />}
      <Button type="submit" variant="ghost" size="sm" className="text-danger hover:text-danger" aria-label={`Delete order ${orderNumber}`}>
        <Trash2 className="size-3.5" />
        {!compact && "Delete order"}
      </Button>
    </form>
  );
}
