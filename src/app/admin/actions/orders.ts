"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_KEYS } from "@/lib/constants";
import { notifyStatusChange } from "@/lib/email/notifications";
import { deleteOrder, OrderError, updateOrderStatus } from "@/lib/orders";

export type StatusState = { error?: string; success?: string } | undefined;

const schema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUS_KEYS as [string, ...string[]]),
  note: z.string().trim().max(500).optional(),
  notify: z.literal("on").optional(),
});

export async function updateOrderStatusAction(_prev: StatusState, formData: FormData): Promise<StatusState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid status update." };
  const { orderId, status, note, notify } = parsed.data;
  const typedStatus = status as (typeof ORDER_STATUS_KEYS)[number];

  try {
    await updateOrderStatus(orderId, typedStatus, note, !!notify);
  } catch (err) {
    if (err instanceof OrderError) return { error: err.message };
    throw err;
  }

  // The customer status email is sent after the response.
  if (notify) after(() => notifyStatusChange(orderId, typedStatus, note));

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { success: notify ? "Status updated. The customer is being emailed." : "Status updated." };
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  try {
    await deleteOrder(id);
  } catch (err) {
    if (!(err instanceof OrderError)) throw err;
  }
  revalidatePath("/admin", "layout");
  if (formData.get("redirect") === "list") redirect("/admin/orders");
}
