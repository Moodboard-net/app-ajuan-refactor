import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@db/schema";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  global.__sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}

/** Query builder Drizzle di atas koneksi postgres.js yang sama (satu pool). */
export const db = drizzle(sql, { schema });
