import { describe, expect, it } from "vitest";
import { formatMoney, fromMinor, parseMoneyInput, toMinor } from "@/lib/money";

describe("toMinor", () => {
  it("converts pounds to piastres", () => {
    expect(toMinor(12.5)).toBe(1250);
  });

  it("rounds rather than truncating, so a cent is never quietly lost", () => {
    expect(toMinor(0.005)).toBe(1);
    expect(toMinor(19.999)).toBe(2000);
  });

  it("survives a round trip", () => {
    expect(fromMinor(toMinor(1234.56))).toBe(1234.56);
  });
});

describe("formatMoney", () => {
  it("drops the decimals on a whole amount", () => {
    expect(formatMoney(95000)).toBe("EGP 950");
  });

  it("keeps two decimals when there is a fraction", () => {
    expect(formatMoney(95050)).toBe("EGP 950.50");
  });

  it("groups thousands", () => {
    expect(formatMoney(101000)).toBe("EGP 1,010");
  });

  it("handles zero", () => {
    expect(formatMoney(0)).toBe("EGP 0");
  });
});

describe("parseMoneyInput", () => {
  it("reads a plain number", () => {
    expect(parseMoneyInput("250")).toBe(25000);
  });

  it("ignores the separators an admin types", () => {
    expect(parseMoneyInput("1,250.50")).toBe(125050);
    expect(parseMoneyInput(" 1 250 ")).toBe(125000);
  });

  it("returns null for blank input", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput(null)).toBeNull();
    expect(parseMoneyInput(undefined)).toBeNull();
  });

  it("rejects nonsense and negatives instead of guessing", () => {
    expect(parseMoneyInput("abc")).toBeNull();
    expect(parseMoneyInput("-5")).toBeNull();
  });
});
