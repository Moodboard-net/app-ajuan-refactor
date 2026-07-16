import postgres from "postgres";
import path from "path";
import fs from "fs";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const applied = new Set(
    (await sql<{ filename: string }[]>`SELECT filename FROM _migrations`).map(
      (r) => r.filename
    )
  );

  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skip ${file} (sudah diterapkan).`);
      continue;
    }
    console.log(`Applying ${file}...`);
    await sql.file(path.join(dir, file));
    await sql`INSERT INTO _migrations (filename) VALUES (${file})`;
  }

  console.log("Migration applied.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
