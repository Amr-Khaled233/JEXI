import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

beforeEach(async () => {
  await db.rateLimit.deleteMany();
});

const key = () => `test:${Math.random().toString(36).slice(2)}`;

describe("rateLimit", () => {
  it("allows exactly the number of attempts it was given", async () => {
    const k = key();
    for (let i = 0; i < 3; i++) expect(await rateLimit(k, 3)).toBe(true);
    expect(await rateLimit(k, 3)).toBe(false);
  });

  it("keeps counting separately for each key, so one visitor cannot lock out another", async () => {
    const [a, b] = [key(), key()];
    expect(await rateLimit(a, 1)).toBe(true);
    expect(await rateLimit(a, 1)).toBe(false);
    expect(await rateLimit(b, 1)).toBe(true);
  });

  it("lets the visitor back in once the window has passed", async () => {
    const k = key();
    expect(await rateLimit(k, 1, 50)).toBe(true);
    expect(await rateLimit(k, 1, 50)).toBe(false);

    await new Promise((r) => setTimeout(r, 80));
    expect(await rateLimit(k, 1, 50)).toBe(true);
  });

  it("counts in the database, so the limit holds across serverless instances", async () => {
    const k = key();
    await rateLimit(k, 5);
    await rateLimit(k, 5);
    const row = await db.rateLimit.findUniqueOrThrow({ where: { key: k } });
    expect(row.count).toBe(2);
  });

  it("holds the limit when the same visitor fires requests at once", async () => {
    const k = key();
    const results = await Promise.all(Array.from({ length: 10 }, () => rateLimit(k, 4)));
    expect(results.filter(Boolean)).toHaveLength(4);
  });
});
