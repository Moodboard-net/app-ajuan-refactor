import postgres from "postgres";
import path from "path";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  await sql.file(path.join(__dirname, "migrations", "0001_init.sql"));
  console.log("Migration applied.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
