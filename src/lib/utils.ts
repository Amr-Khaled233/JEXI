import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Normalise an Egyptian phone number to 01XXXXXXXXX when possible. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  const m = digits.match(/^(?:\+?20|0020)?0?(1[0125]\d{8})$/);
  return m ? `0${m[1]}` : digits;
}

export function isValidEgyptianMobile(input: string): boolean {
  return /^01[0125]\d{8}$/.test(normalizePhone(input));
}

/**
 * wa.me link for an Egyptian number, or null when there are no digits to dial.
 * A leading 0 is kept, not dropped: 01012345678 becomes 201012345678, where that
 * 0 is already the second digit of Egypt's +20.
 */
export function whatsappUrl(number: string | null | undefined): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("0") ? `2${digits}` : digits}`;
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Cairo",
  });
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function appUrl(path = ""): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}
