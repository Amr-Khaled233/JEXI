import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { testDatabaseUrl } from "./tests/db/database-url";

/**
 * Two suites:
 *   unit  pure logic, no database, runs anywhere (`npm test`)
 *   db    the pricing and order engine against a real Postgres (`npm run test:db`)
 */
const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" },
      },
      {
        resolve: { alias },
        test: {
          name: "db",
          include: ["tests/db/**/*.test.ts"],
          environment: "node",
          globalSetup: ["./tests/db/global-setup.ts"],
          env: { DATABASE_URL: testDatabaseUrl() ?? "" },
          // One database, so tests that move stock around must not overlap.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
