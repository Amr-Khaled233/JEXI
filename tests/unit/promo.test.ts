import { describe, expect, it } from "vitest";
import { calculateDiscount, promoStatus } from "@/lib/promo";

const base = { active: true, startsAt: new Date("2026-01-01"), endsAt: new Date("2026-12-31"), usageLimit: null, usedCount: 0 };
const now = new Date("2026-06-01");

describe("promoStatus", () => {
  it("is active inside its window", () => {
    expect(promoStatus(base, now)).toBe("ACTIVE");
  });

  it("reports the switch before anything else", () => {
    expect(promoStatus({ ...base, active: false }, now)).toBe("INACTIVE");
  });

  it("is scheduled before it starts", () => {
    expect(promoStatus({ ...base, startsAt: new Date("2026-09-01") }, now)).toBe("SCHEDULED");
  });

  it("expires on its own after the end date, with no background job", () => {
    expect(promoStatus({ ...base, endsAt: new Date("2026-05-01") }, now)).toBe("EXPIRED");
  });

  it("stops itself once the usage limit is reached", () => {
    expect(promoStatus({ ...base, usageLimit: 10, usedCount: 10 }, now)).toBe("EXHAUSTED");
    expect(promoStatus({ ...base, usageLimit: 10, usedCount: 9 }, now)).toBe("ACTIVE");
  });
});

describe("calculateDiscount", () => {
  it("takes a percentage of the subtotal", () => {
    expect(calculateDiscount({ discountType: "PERCENTAGE", value: 10 }, 95000)).toBe(9500);
  });

  it("rounds to whole piastres", () => {
    expect(calculateDiscount({ discountType: "PERCENTAGE", value: 33 }, 10001)).toBe(3300);
  });

  it("never gives away more than the order is worth", () => {
    expect(calculateDiscount({ discountType: "PERCENTAGE", value: 150 }, 50000)).toBe(50000);
    expect(calculateDiscount({ discountType: "FIXED", value: 90000 }, 50000)).toBe(50000);
  });

  it("subtracts a fixed amount", () => {
    expect(calculateDiscount({ discountType: "FIXED", value: 10000 }, 95000)).toBe(10000);
  });
});
