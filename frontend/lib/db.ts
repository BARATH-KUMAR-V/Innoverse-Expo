import { Pool } from "pg";
import { env } from "./env";

// Supabase's Postgres requires SSL for external connections, and Supabase
// issues certificates that Node's default CA bundle does not always chain
// to, so `rejectUnauthorized: false` is the commonly recommended setting -
// the connection is still encrypted, it just skips strict CA verification.
// A plain local Postgres (e.g. for offline development) usually has no SSL
// configured at all, so SSL is skipped automatically when DATABASE_URL
// points at localhost/127.0.0.1.
const isLocalDatabase = /(localhost|127\.0\.0\.1)/.test(env.databaseUrl);

// Route Handlers run as short-lived serverless functions rather than one
// long-lived server, so DATABASE_URL should point at Supabase's Transaction
// mode pooler (port 6543) - see README §3.3 - and this pool only needs a
// handful of connections per warm function instance; the pooler does the
// real connection multiplexing in front of Postgres.
declare global {
  // eslint-disable-next-line no-var
  var __innoversePool: Pool | undefined;
}

export const pool =
  global.__innoversePool ??
  new Pool({
    connectionString: env.databaseUrl,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30_000,
  });

if (!env.isProduction) {
  // Reuse the pool across Next.js dev-server hot reloads instead of leaking
  // a new one on every file save.
  global.__innoversePool = pool;
}

pool.on("error", (err) => {
  // Errors on idle clients (e.g. a dropped connection) must not crash the
  // whole process - just log them.
  // eslint-disable-next-line no-console
  console.error("Unexpected PostgreSQL pool error:", err);
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("select 1");
  } finally {
    client.release();
  }
}
