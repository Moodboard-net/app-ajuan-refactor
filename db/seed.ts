import postgres from "postgres";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL!);

async function requireEnv(name: string): Promise<string> {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diset di environment`);
  return value;
}

async function upsertUser(
  username: string,
  password: string,
  role: "admin" | "dirkeu" | "divisi",
  namaLengkap: string,
  divisiKode?: string
) {
  const hash = await bcrypt.hash(password, 12);
  const idDivisi = divisiKode
    ? (
        await sql<{ id: number }[]>`SELECT id FROM lib_divisi WHERE kode = ${divisiKode}`
      )[0]?.id
    : null;

  await sql`
    INSERT INTO tb_user (username, password_hash, role, id_divisi, nama_lengkap)
    VALUES (${username}, ${hash}, ${role}, ${idDivisi}, ${namaLengkap})
    ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, updated_at = now()
  `;

  console.log(`Seeded user: ${username} (${role})`);
}

async function main() {
  await upsertUser(
    await requireEnv("SEED_ADMIN_USERNAME"),
    await requireEnv("SEED_ADMIN_PASSWORD"),
    "admin",
    "Admin"
  );

  await upsertUser(
    await requireEnv("SEED_DIRKEU_USERNAME"),
    await requireEnv("SEED_DIRKEU_PASSWORD"),
    "dirkeu",
    "Direktur Keuangan"
  );

  const divisiPassword = await requireEnv("SEED_DIVISI_PASSWORD");
  const divisiList: { kode: string; nama: string }[] = await sql`
    SELECT kode, nama FROM lib_divisi ORDER BY id
  `;

  for (const divisi of divisiList) {
    await upsertUser(
      divisi.kode,
      divisiPassword,
      "divisi",
      divisi.nama,
      divisi.kode
    );
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
