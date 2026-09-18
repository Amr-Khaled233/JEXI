import { formatMoney } from "@/lib/money";
import type { Settings } from "@/lib/settings";

type ZoneLike = { name: string; enabled: boolean; fee: number | null; estimatedDelivery: string | null };

export type ShippingQuote = {
  fee: number;
  free: boolean;
  label: string;
  zone: string | null;
  estimatedDelivery: string | null;
  /** false when the chosen governorate is hidden/unknown. */
  available: boolean;
  /** true until a governorate is chosen. */
  pending: boolean;
};

/**
 * Shipping rules, in order:
 * 1. A zone with a fee override > 0 charges that fee.
 * 2. Otherwise, free shipping when enabled in Settings (the default).
 * 3. Otherwise, the store's default shipping fee.
 * 4. Any fee is waived when the order (after discount) reaches the free-shipping threshold.
 */
export function computeShipping(settings: Settings, zone: ZoneLike | null, merchandiseTotal: number, requestedZone?: string | null): ShippingQuote {
  if (!zone) {
    if (requestedZone) {
      return { fee: 0, free: false, label: "Unavailable", zone: requestedZone, estimatedDelivery: null, available: false, pending: false };
    }
    const free = settings.freeShippingEnabled;
    return {
      fee: 0,
      free,
      label: free ? "Free Shipping" : "Calculated at checkout",
      zone: null,
      estimatedDelivery: null,
      available: true,
      pending: true,
    };
  }

  if (!zone.enabled) {
    return { fee: 0, free: false, label: "Unavailable", zone: zone.name, estimatedDelivery: null, available: false, pending: false };
  }

  let fee: number;
  if (zone.fee != null && zone.fee > 0) fee = zone.fee;
  else if (settings.freeShippingEnabled) fee = 0;
  else fee = zone.fee ?? settings.defaultShippingFee;

  if (fee > 0 && settings.freeShippingThreshold != null && merchandiseTotal >= settings.freeShippingThreshold) {
    fee = 0;
  }

  return {
    fee,
    free: fee === 0,
    label: fee === 0 ? "Free Shipping" : formatMoney(fee),
    zone: zone.name,
    estimatedDelivery: zone.estimatedDelivery,
    available: true,
    pending: false,
  };
}
