import { describe, expect, it } from "vitest";
import { computeShipping, freeShippingMessage, freeShippingOffer } from "@/lib/shipping";

const noOffer = { freeShippingEnabled: false, freeShippingStartsAt: null, freeShippingEndsAt: null, freeShippingThreshold: null };
const zone = { name: "Cairo", enabled: true, fee: 6000, estimatedDelivery: "1 to 3 business days" };

describe("freeShippingOffer", () => {
  it("is off while the switch is off, whatever the dates say", () => {
    expect(freeShippingOffer({ ...noOffer, freeShippingStartsAt: new Date("2020-01-01") }).active).toBe(false);
  });

  it("is off before the start date and counts as scheduled", () => {
    const offer = freeShippingOffer({ ...noOffer, freeShippingEnabled: true, freeShippingStartsAt: new Date("2030-01-01") });
    expect(offer.active).toBe(false);
    expect(offer.scheduled).toBe(true);
  });

  it("is off after the end date", () => {
    expect(freeShippingOffer({ ...noOffer, freeShippingEnabled: true, freeShippingEndsAt: new Date("2020-01-01") }).active).toBe(false);
  });

  it("is on inside the window", () => {
    const settings = { ...noOffer, freeShippingEnabled: true, freeShippingStartsAt: new Date("2020-01-01"), freeShippingEndsAt: new Date("2030-01-01") };
    expect(freeShippingOffer(settings, new Date("2026-06-01")).active).toBe(true);
  });
});

describe("freeShippingMessage", () => {
  it("says nothing when there is no offer", () => {
    expect(freeShippingMessage(noOffer)).toBeNull();
  });

  it("names the minimum when there is one", () => {
    expect(freeShippingMessage({ ...noOffer, freeShippingEnabled: true, freeShippingThreshold: 100000 })).toBe("Free shipping on orders over EGP 1,000");
  });

  it("is unconditional without a minimum", () => {
    expect(freeShippingMessage({ ...noOffer, freeShippingEnabled: true })).toBe("Free shipping across Egypt");
  });
});

describe("computeShipping", () => {
  it("waits for a governorate before naming a fee", () => {
    const quote = computeShipping(noOffer, null, 50000);
    expect(quote.pending).toBe(true);
    expect(quote.available).toBe(true);
    expect(quote.label).toBe("Calculated at checkout");
  });

  it("refuses a governorate that has no zone", () => {
    const quote = computeShipping(noOffer, null, 50000, "Atlantis");
    expect(quote.available).toBe(false);
    expect(quote.pending).toBe(false);
  });

  it("refuses a zone the admin switched off", () => {
    expect(computeShipping(noOffer, { ...zone, enabled: false }, 50000).available).toBe(false);
  });

  it("charges the fee set for the governorate", () => {
    const quote = computeShipping(noOffer, zone, 50000);
    expect(quote.fee).toBe(6000);
    expect(quote.free).toBe(false);
    expect(quote.label).toBe("EGP 60");
  });

  it("treats a blank zone fee as free, which is what an empty field means", () => {
    const quote = computeShipping(noOffer, { ...zone, fee: null }, 50000);
    expect(quote.fee).toBe(0);
    expect(quote.free).toBe(true);
  });

  it("waives the fee once the order reaches the free-shipping minimum", () => {
    const settings = { ...noOffer, freeShippingEnabled: true, freeShippingThreshold: 100000 };
    expect(computeShipping(settings, zone, 99999).fee).toBe(6000);
    expect(computeShipping(settings, zone, 100000).fee).toBe(0);
  });

  it("measures the minimum after the discount, not before", () => {
    const settings = { ...noOffer, freeShippingEnabled: true, freeShippingThreshold: 100000 };
    // A 120,000 order with a 30,000 discount is 90,000 of merchandise: still short.
    expect(computeShipping(settings, zone, 120000 - 30000).fee).toBe(6000);
  });

  it("carries the delivery estimate through", () => {
    expect(computeShipping(noOffer, zone, 50000).estimatedDelivery).toBe("1 to 3 business days");
  });
});
