import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 10,
});

const db = globalForDb.db ?? drizzle(conn, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
  globalForDb.db = db;
}

export { db, conn };
export * from "./schema";