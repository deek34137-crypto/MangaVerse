import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

const connectionString = (process.env.NODE_ENV === "development" ? process.env.DIRECT_URL : process.env.DATABASE_URL) || process.env.DATABASE_URL!;

const conn = globalForDb.conn ?? postgres(connectionString, {
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  idle_timeout: 15,     // Close idle connections after 15s to prevent pool exhaustion in dev
  connect_timeout: 10,   // Fail connection attempts fast after 10s instead of hanging
});

const db = globalForDb.db ?? drizzle(conn, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
  globalForDb.db = db;
}

export { db, conn };
export * from "./schema";