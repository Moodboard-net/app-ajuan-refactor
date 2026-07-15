# Ajuan Pembayaran

Aplikasi ajuan pembayaran, upload bukti transfer, upload LPJ, approval Dirkeu, dan dashboard rekap.

Rebuild dari aplikasi lama (Next.js + PostgreSQL) menjadi stack baru sesuai [issue.md](issue.md):

- **Next.js (App Router, TypeScript)** + **shadcn/ui**
- **PostgreSQL** sebagai database
- **RustFS** (S3-compatible) sebagai object storage untuk bukti transfer & LPJ
- Semua dijalankan lewat **Docker Compose**, lokal saja (dikelola tim infra)

## Role

- **Admin** — dashboard rekap (`/cek-ajuan`), import/export Excel.
- **Dirkeu** (Direktur Keuangan) — halaman approval (`/approval`), menegakkan aturan LPJ gate.
- **Divisi** — satu akun per divisi (Organisasi, HRD, Pendidikan, Marketing & Experience/MCX, Keuangan). Input ajuan sendiri, upload bukti transfer & LPJ ajuan miliknya sendiri (`/ajuan`).

### Aturan LPJ Gate

Ajuan baru dari suatu divisi **tidak bisa disetujui Dirkeu** selama divisi tersebut masih punya ajuan lain berstatus "Selesai Dibayar" yang belum diupload LPJ-nya. Ditampilkan sebagai badge peringatan di halaman approval.

## Menjalankan Secara Lokal

1. Salin environment:

   ```bash
   cp .env.example .env
   ```

   Isi `POSTGRES_PASSWORD`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `APP_SESSION_SECRET` (nilai acak, jangan kosong), dan `SEED_*_PASSWORD` untuk akun awal.

2. Jalankan semua service (app + PostgreSQL + RustFS):

   ```bash
   docker compose up --build
   ```

3. Terapkan skema database (sekali saja, saat pertama kali setup):

   ```bash
   npm run db:migrate
   ```

4. Buat akun awal (Admin, Dirkeu, 5 akun Divisi):

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

Migrasi data dari aplikasi lama (Next.js + PostgreSQL) adalah proses **sekali jalan**, wajib dilakukan sebelum cutover:

1. Isi `OLD_DATABASE_URL` di `.env` mengarah ke database lama.
2. Salin `db/divisi-mapping.example.json` -> `db/divisi-mapping.json`, isi pemetaan nilai `divisi_cabang` lama ke kode divisi baru (`organisasi`, `hrd`, `pendidikan`, `mcx`, `keuangan`).
3. Jalankan:

   ```bash
   npm run db:migrate-legacy
   ```

4. Baca output: baris yang dilewati (skip) akan dicetak di akhir — tinjau manual sebelum go-live.

**Belum divalidasi terhadap data produksi asli** — script ini ditulis berdasarkan skema aplikasi lama yang diarsipkan di `_legacy/`, tapi belum pernah dijalankan terhadap database produksi sungguhan. Jalankan dulu di salinan/staging data sebelum dipakai untuk cutover final, dan tinjau baris yang dilewati.

## Struktur Penting

```text
src/
  app/            # Routes (App Router), termasuk (app)/ untuk halaman yang butuh login
  components/     # Komponen UI (termasuk shadcn/ui di components/ui)
  lib/            # Auth, db, storage (RustFS), domain logic, server actions
db/
  migrations/     # Skema SQL
  seed.ts         # Seed akun awal
  migrate-legacy-data.ts  # Migrasi data dari aplikasi lama
_legacy/          # Arsip aplikasi lama (gitignored, referensi saja)
issue.md          # Planning awal rebuild ini
```

## Checklist Sebelum Cutover

- [ ] Migrasi data lama sudah dijalankan dan divalidasi (row count & sampling cocok).
- [ ] Freeze input di aplikasi lama sudah dikoordinasikan dengan Admin/Dirkeu/Divisi.
- [ ] Login Admin, Dirkeu, dan seluruh akun Divisi sudah dites.
- [ ] Upload bukti transfer & LPJ sudah dites (file benar-benar tersimpan di RustFS).
- [ ] Aturan LPJ gate sudah dites (ajuan baru divisi dengan LPJ tertunda benar-benar terblokir).
- [ ] Aplikasi lama dinonaktifkan setelah cutover selesai.
