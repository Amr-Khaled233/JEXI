import { formatMoney } from "@/lib/money";

type ZoneLike = { name: string; enabled: boolean; fee: number | null; estimatedDelivery: string | null };

type ShippingSettings = {
  freeShippingEnabled: boolean;
  freeShippingStartsAt: Date | null;
  freeShippingEndsAt: Date | null;
  freeShippingThreshold: number | null;
  defaultShippingFee: number;
};

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

/** The free-shipping offer as configured in Admin → Free Shipping. */
export function freeShippingOffer(settings: ShippingSettings, now = new Date()) {
  const started = !settings.freeShippingStartsAt || now >= settings.freeShippingStartsAt;
  const notEnded = !settings.freeShippingEndsAt || now <= settings.freeShippingEndsAt;
  const active = settings.freeShippingEnabled && started && notEnded;
  const scheduled = settings.freeShippingEnabled && !started;
  return { active, scheduled, minimum: settings.freeShippingThreshold, endsAt: settings.freeShippingEndsAt };
}

/** Short customer-facing line, e.g. "Free shipping on orders over EGP 1,000". Null when there's no offer. */
export function freeShippingMessage(settings: ShippingSettings) {
  const offer = freeShippingOffer(settings);
  if (!offer.active) return null;
  return offer.minimum ? `Free shipping on orders over ${formatMoney(offer.minimum)}` : "Free shipping across Egypt";
}

/**
 * Shipping rules:
 * 1. Free when the free-shipping offer is on, today is inside its dates (if set),
 *    and the order after discount reaches its minimum (if set).
 * 2. Otherwise the governorate's own fee, or the store's default fee.
 */
export function computeShipping(settings: ShippingSettings, zone: ZoneLike | null, merchandiseTotal: number, requestedZone?: string | null): ShippingQuote {
  const offer = freeShippingOffer(settings);
  const qualifiesForFree = offer.active && (offer.minimum == null || merchandiseTotal >= offer.minimum);

  if (!zone) {
    if (requestedZone) {
      return { fee: 0, free: false, label: "Unavailable", zone: requestedZone, estimatedDelivery: null, available: false, pending: false };
    }
    return {
      fee: 0,
      free: qualifiesForFree,
      label: qualifiesForFree ? "Free Shipping" : "Calculated at checkout",
      zone: null,
      estimatedDelivery: null,
      available: true,
      pending: true,
    };
  }

  if (!zone.enabled) {
    return { fee: 0, free: false, label: "Unavailable", zone: zone.name, estimatedDelivery: null, available: false, pending: false };
  }

  const fee = qualifiesForFree ? 0 : (zone.fee ?? settings.defaultShippingFee);
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
