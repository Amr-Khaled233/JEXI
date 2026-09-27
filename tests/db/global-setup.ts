import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { Client } from "pg";
import { testDatabaseUrl } from "./database-url";

// Run the CLI's entry point with this same node binary: no shell, so the command
// behaves identically on Windows and on CI.
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

/**
 * Builds a throwaway database next to the development one and applies the
 * migrations. Dropping and recreating it each run means a failed test can never
 * leave the next one standing on stale rows.
 */
export default async function setup() {
  const target = testDatabaseUrl();
  if (!target) throw new Error("DATABASE_URL is not set, so there is nothing to build the test database from.");

  const url = new URL(target);
  const dbName = url.pathname.replace(/^\//, "");
  const admin = new URL(target);
  admin.pathname = "/postgres";

  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await client.end();
  }

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, DATABASE_URL: target },
  });
}
