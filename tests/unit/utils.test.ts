import { describe, expect, it } from "vitest";
import { isValidEgyptianMobile, normalizePhone, slugify, whatsappUrl } from "@/lib/utils";
import { ORDER_FLOW, ORDER_STATUS_KEYS, OPEN_ORDER_STATUSES, reservesStock, swatchBackground } from "@/lib/constants";

describe("normalizePhone", () => {
  it("leaves a local number alone", () => {
    expect(normalizePhone("01012345678")).toBe("01012345678");
  });

  it("strips spaces and dashes", () => {
    expect(normalizePhone("0101 234 5678")).toBe("01012345678");
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  });

  it("brings international forms back to the local one", () => {
    expect(normalizePhone("+201012345678")).toBe("01012345678");
    expect(normalizePhone("00201012345678")).toBe("01012345678");
    expect(normalizePhone("201012345678")).toBe("01012345678");
  });

  it("hands back what it got when it cannot make sense of it", () => {
    expect(normalizePhone("12345")).toBe("12345");
  });
});

describe("isValidEgyptianMobile", () => {
  it.each(["01012345678", "01112345678", "01212345678", "01512345678", "+20 101 234 5678"])("accepts %s", (n) => {
    expect(isValidEgyptianMobile(n)).toBe(true);
  });

  it.each(["01312345678", "0101234567", "010123456789", "0212345678", "", "not a phone"])("rejects %s", (n) => {
    expect(isValidEgyptianMobile(n)).toBe(false);
  });
});

describe("whatsappUrl", () => {
  it("keeps the leading zero, which is already the 0 of +20", () => {
    expect(whatsappUrl("01012345678")).toBe("https://wa.me/201012345678");
  });

  it("strips whatever punctuation the admin typed", () => {
    expect(whatsappUrl("0101 234 5678")).toBe("https://wa.me/201012345678");
    expect(whatsappUrl("+20 (101) 234-5678")).toBe("https://wa.me/201012345678");
  });

  it("has nothing to dial without digits", () => {
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl("")).toBeNull();
    expect(whatsappUrl("   ")).toBeNull();
  });
});

describe("slugify", () => {
  it("builds a url-safe slug", () => {
    expect(slugify("Aurelia Pendant Necklace")).toBe("aurelia-pendant-necklace");
  });

  it("collapses punctuation instead of leaving dashes hanging", () => {
    expect(slugify("  Gold & Pearl -- Ring!  ")).toBe("gold-pearl-ring");
  });

  it("stays within the column length", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("order statuses", () => {
  it("counts every status that still holds stock", () => {
    expect(OPEN_ORDER_STATUSES).toEqual(["PENDING", "CONFIRMED", "SHIPPED"]);
  });

  it("does not hold stock once delivered or cancelled", () => {
    expect(reservesStock("DELIVERED")).toBe(false);
    expect(reservesStock("CANCELLED")).toBe(false);
  });

  it("tracks the customer through four steps", () => {
    expect(ORDER_FLOW).toEqual(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]);
  });

  it("knows every status the database can hold", () => {
    expect(ORDER_STATUS_KEYS).toEqual(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);
  });
});

describe("swatchBackground", () => {
  it("builds a gradient from a hex colour", () => {
    expect(swatchBackground("#d4af37")).toContain("linear-gradient");
  });

  it("falls back to grey rather than emitting broken css", () => {
    expect(swatchBackground("gold")).toBe("#888888");
    expect(swatchBackground("#fff")).toBe("#888888");
  });
});
