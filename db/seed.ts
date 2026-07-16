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
  role: "super_admin" | "approval",
  namaLengkap: string
) {
  const hash = await bcrypt.hash(password, 12);

  await sql`
    INSERT INTO tb_user (username, password_hash, role, nama_lengkap)
    VALUES (${username}, ${hash}, ${role}, ${namaLengkap})
    ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, updated_at = now()
  `;

  console.log(`Seeded user: ${username} (${role})`);
}

const DIVISI: { kode: string; nama: string }[] = [
  { kode: "organisasi", nama: "Organisasi" },
  { kode: "hrd", nama: "HRD" },
  { kode: "pendidikan", nama: "Pendidikan" },
  { kode: "mcx", nama: "Marketing & Experience (MCX)" },
  { kode: "keuangan", nama: "Keuangan" },
];

/**
 * Data referensi divisi. Dulu di-insert langsung di migrasi awal
 * (0001_init.sql); sejak pindah ke Drizzle, migrasi hanya berisi skema
 * (DDL) -- data referensi jadi tanggung jawab seed.
 */
async function seedDivisi() {
  for (const d of DIVISI) {
    await sql`
      INSERT INTO lib_divisi (kode, nama)
      VALUES (${d.kode}, ${d.nama})
      ON CONFLICT (kode) DO NOTHING
    `;
  }
  console.log(`Seeded ${DIVISI.length} divisi`);
}

async function main() {
  await seedDivisi();

  await upsertUser(
    await requireEnv("SEED_SUPER_ADMIN_USERNAME"),
    await requireEnv("SEED_SUPER_ADMIN_PASSWORD"),
    "super_admin",
    "Super Admin"
  );

  await upsertUser(
    await requireEnv("SEED_APPROVAL_USERNAME"),
    await requireEnv("SEED_APPROVAL_PASSWORD"),
    "approval",
    "Direktur Keuangan"
  );

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
