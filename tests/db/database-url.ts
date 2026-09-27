/**
 * Where the database tests run. Never your development database: the name from
 * DATABASE_URL gets "_test" appended, so `jexi` becomes `jexi_test`, and that
 * database is dropped and rebuilt before every run.
 */
export function testDatabaseUrl(from = process.env.DATABASE_URL): string | null {
  if (!from) return null;
  const url = new URL(from);
  const name = url.pathname.replace(/^\//, "") || "jexi";
  if (name.endsWith("_test")) return url.toString();
  url.pathname = `/${name}_test`;
  return url.toString();
}
