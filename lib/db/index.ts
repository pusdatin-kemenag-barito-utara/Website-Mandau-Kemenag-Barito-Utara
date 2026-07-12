import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const isProd = process.env.NODE_ENV === "production";
const createPool = () => new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProd ? 15 : 10, // 15 di VPS/Production, 10 di Local Dev agar tidak bocor
  idleTimeoutMillis: isProd ? 30000 : 10000,
  connectionTimeoutMillis: 30000,
  allowExitOnIdle: !isProd,       // Dev: pool exit jika idle (cegah numpuk)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const globalForDb = globalThis as unknown as {
  dbPool: Pool | undefined;
};

const pool = globalForDb.dbPool ?? createPool();

if (!isProd) {
  globalForDb.dbPool = pool;
}

export const db = drizzle(pool, { schema });

export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key: string, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}
