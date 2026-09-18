import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Falls back to a local default so `prisma generate` works without a .env.
    url: process.env.DATABASE_URL ?? "postgresql://jexi:jexi@localhost:5432/jexi",
  },
});
