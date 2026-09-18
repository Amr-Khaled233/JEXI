// All money is stored as integer piastres (1 EGP = 100 piastres).

export const CURRENCY = "EGP";

export function toMinor(egp: number): number {
  return Math.round(egp * 100);
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number): string {
  const value = minor / 100;
  const whole = Number.isInteger(value);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY} ${formatted}`;
}

/** Parse an admin-entered EGP amount ("1,250.50") into piastres. Returns null for blank input. */
export function parseMoneyInput(input: FormDataEntryValue | string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return toMinor(n);
}
