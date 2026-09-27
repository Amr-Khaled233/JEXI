import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  // In development the module is re-evaluated on every hot reload, so the client
  // is kept on globalThis to avoid opening a new pool each time.
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * The Prisma client, connected on first use rather than on import. Modules that
 * only hold rules, and the pages that import them, then cost nothing and need no
 * DATABASE_URL until something actually queries.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
