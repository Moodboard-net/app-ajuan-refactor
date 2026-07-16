# Ajuan Pembayaran

Aplikasi pencatatan ajuan pembayaran untuk bagian Keuangan: pengajuan publik tanpa login, verifikasi & approval 2 tahap, upload bukti transfer, upload LPJ, dan dashboard rekap.

Dibangun dengan:

- **Next.js (App Router, TypeScript)** + **shadcn/ui**
- **PostgreSQL** sebagai database
- **RustFS** (S3-compatible) sebagai object storage untuk bukti transfer, LPJ, dan foto profil
- Semua dijalankan lewat **Docker Compose**, lokal saja (dikelola tim infra)

## Alur & Role

Divisi **tidak perlu akun/login** — siapa pun bisa mengisi form ajuan seperti membuat tiket. Ada 2 role internal:

- **Super Admin** — dashboard rekap (`/cek-ajuan`), verifikasi ajuan publik (`/verifikasi`), import/export Excel, manajemen user (`/users`).
- **Approval** (Direktur Keuangan) — dashboard & antrian approval (`/approval`): setujui / tolak / minta revisi, upload bukti transfer, menegakkan aturan LPJ gate.

Kedua role juga punya halaman **Profile** (`/profile`) untuk ganti foto, nama, dan password sendiri.

Alur pengajuan (lihat [issue #7](https://github.com/Moodboard-net/app-ajuan-refactor/issues/7) untuk latar belakang lengkap):

```text
/ajukan (publik, tanpa login)
   -> Menunggu Verifikasi
        -> Super Admin koreksi/lengkapi data, tekan "Ajukan ke Approval"
   -> Menunggu Approval
        -> Approval: Setujui / Tolak / Minta Revisi (catatan wajib utk 2 terakhir)
        -> Ditolak/Perlu Revisi bisa diperbaiki Super Admin lalu diajukan ulang
   -> Disetujui -> Approval upload bukti transfer -> Selesai Dibayar
   -> Pengaju upload LPJ lewat /lacak (kode tracking), atau Super Admin sebagai cadangan
```

### Aturan LPJ Gate

Ajuan baru dari suatu divisi **tidak bisa disetujui** selama divisi tersebut masih punya ajuan lain berstatus "Selesai Dibayar" yang belum diupload LPJ-nya. Ditampilkan sebagai badge peringatan di halaman approval.

## Menjalankan Secara Lokal

1. Salin environment:

   ```bash
   cp .env.example .env
   ```

   Isi `POSTGRES_PASSWORD`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `APP_SESSION_SECRET` (nilai acak, jangan kosong), dan `SEED_SUPER_ADMIN_*` / `SEED_APPROVAL_*` untuk akun awal.

2. Jalankan semua service (app + PostgreSQL + RustFS):

   ```bash
   docker compose up --build
   ```

3. Terapkan skema database lewat Drizzle (aman dijalankan berulang; migrasi yang sudah tercatat otomatis dilewati):

   ```bash
   npm run db:migrate
   ```

4. Buat akun awal (Super Admin & Approval):

   ```bash
   npm run db:seed
   ```

5. Buka `http://localhost:3000`.

### Development (tanpa rebuild image tiap ganti kode)

Jalankan Postgres & RustFS saja lewat Docker, lalu jalankan Next.js langsung di host:

```bash
docker compose up postgres rustfs
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Migrasi Data Lama

Migrasi data dari aplikasi lama (Next.js + PostgreSQL, 3 role dengan login) adalah proses **sekali jalan**, wajib dilakukan sebelum cutover:

1. Isi `OLD_DATABASE_URL` di `.env` mengarah ke database lama.
2. Salin `db/divisi-mapping.example.json` -> `db/divisi-mapping.json`, isi pemetaan nilai `divisi_cabang` lama ke kode divisi baru (`organisasi`, `hrd`, `pendidikan`, `mcx`, `keuangan`).
3. Jalankan:

   ```bash
   npm run db:migrate-legacy
   ```

4. Baca output: baris yang dilewati (skip) akan dicetak di akhir — tinjau manual sebelum go-live.

Script ini hanya memigrasikan data **ajuan** (bukan akun user) — sejak alur publik tanpa login, akun per-divisi lama tidak lagi dibawa. **Belum divalidasi terhadap data produksi asli**, jalankan dulu di salinan/staging data sebelum dipakai untuk cutover final.

## Database & Migrasi (Drizzle ORM)

Skema database dideklarasikan sekali di [`db/schema.ts`](db/schema.ts) menggunakan [Drizzle ORM](https://orm.drizzle.team/). Migrasi SQL **di-generate dari skema**, tidak ditulis tangan lagi.

**Menambah/mengubah skema:**

1. Ubah `db/schema.ts` (tambah tabel/kolom, ubah tipe, dsb. — ikuti konvensi snake_case & kolom audit yang sudah ada).
2. Generate file migrasi:

   ```bash
   npx drizzle-kit generate
   ```

3. Tinjau file `.sql` yang dihasilkan di `db/migrations/` sebelum commit.
4. Terapkan ke database lokal: `npm run db:migrate`.

**Jangan pernah** menjalankan `drizzle-kit push` pada database yang berisi data — perintah itu menyamakan skema secara paksa dan bisa membuang data. Selalu lewat alur `generate` + `migrate` di atas.

Query di `src/services/*` sedang dipindah bertahap dari raw SQL (`postgres.js` tagged template, `sql` dari `@/lib/db`) ke query builder Drizzle (`db` dari `@/lib/db`, sama-sama jalan di atas koneksi yang sama). Sebagian service masih raw SQL — itu tidak apa-apa, keduanya bisa hidup berdampingan.

`db/migrations-legacy/` menyimpan file migrasi tulisan tangan dari sebelum Drizzle diadopsi (`0001_init.sql`, `0002_role_rename_alur_publik.sql`) sebagai referensi historis — sudah tidak dijalankan lagi, digantikan oleh migrasi `db/migrations/` yang di-generate Drizzle.

## Struktur Penting

```text
src/
  app/            # HANYA routing: page.tsx, layout.tsx, route.ts (App Router), termasuk /ajukan & /lacak publik
  components/     # Komponen UI reusable (client), termasuk shadcn/ui di components/ui
  services/       # Server actions: query database, mutasi, guard role ("use server")
  lib/            # Auth/session (db.ts: koneksi postgres.js + instance Drizzle), storage (RustFS), format, dsb.
  models/         # Tipe data domain (User, Ajuan, dsb.)
  types/          # Tipe bersama lintas layer (Role, ActionState)
db/
  schema.ts       # Skema Drizzle -- satu sumber kebenaran struktur database
  migrations/     # Migrasi SQL, di-generate dari schema.ts via `drizzle-kit generate`
  migrations-legacy/  # Arsip migrasi tulisan tangan sebelum Drizzle (referensi saja)
  migrate.ts      # Runner migrasi Drizzle
  seed.ts         # Seed data referensi (divisi) + akun awal (Super Admin & Approval)
  migrate-legacy-data.ts  # Migrasi data ajuan dari aplikasi lama
_legacy/          # Arsip aplikasi lama (gitignored, referensi saja)
```

## Checklist Sebelum Cutover

- [ ] Migrasi data lama sudah dijalankan dan divalidasi (row count & sampling cocok).
- [ ] Freeze input di aplikasi lama sudah dikoordinasikan dengan tim Keuangan.
- [ ] Login Super Admin & Approval sudah dites.
- [ ] Form publik `/ajukan` dan `/lacak` sudah dites (termasuk upload LPJ lewat kode tracking).
- [ ] Alur 2 tahap sudah dites: verifikasi -> approval (setujui/tolak/minta revisi) -> upload bukti transfer -> upload LPJ.
- [ ] Aturan LPJ gate sudah dites (ajuan baru divisi dengan LPJ tertunda benar-benar terblokir).
- [ ] Halaman Profile (foto, nama, ganti password) sudah dites.
- [ ] Aplikasi lama dinonaktifkan setelah cutover selesai.
