import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./db/migrations" });

  console.log("Migration applied.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
