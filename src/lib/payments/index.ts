// Payment method registry. Cash on Delivery is the only method today.
// To add a gateway (Paymob, Fawry, Stripe…):
//   1. Add the value to the PaymentMethod enum in prisma/schema.prisma and migrate.
//   2. Implement PaymentProvider in this folder. `initiate` should create the
//      payment session and return the hosted-checkout URL.
//   3. Register it below, and add a webhook route that marks the order PAID.
import type { PaymentMethod } from "@/generated/prisma/enums";

export type PaymentOrder = { id: string; orderNumber: string; total: number; email: string; phone: string; customerName: string };

export interface PaymentProvider {
  method: PaymentMethod;
  label: string;
  description: string;
  enabled: () => boolean;
  /** Called right after the order is created. Return a URL to redirect the customer to, or null. */
  initiate: (order: PaymentOrder) => Promise<{ redirectUrl: string | null }>;
}

const cashOnDelivery: PaymentProvider = {
  method: "COD",
  label: "Cash on Delivery",
  description: "Pay for your pieces in cash when your order arrives.",
  enabled: () => true,
  initiate: async () => ({ redirectUrl: null }),
};

const providers: Record<PaymentMethod, PaymentProvider> = {
  COD: cashOnDelivery,
};

export function getPaymentProvider(method: string): PaymentProvider | null {
  const p = providers[method as PaymentMethod];
  return p && p.enabled() ? p : null;
}

export function listPaymentMethods() {
  return Object.values(providers)
    .filter((p) => p.enabled())
    .map(({ method, label, description }) => ({ method, label, description }));
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = { COD: "Cash on Delivery" };
