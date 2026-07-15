import postgres from "postgres";

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
