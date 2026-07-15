# Issue: Rebuild Ajuan Pembayaran — Next.js + TypeScript + PostgreSQL + RustFS + Docker (Local)

> Catatan: dokumen ini menggantikan rencana sebelumnya (Bun + ElysiaJS + MySQL). Keputusan final: **rebuild dari nol** dengan stack di bawah, dijalankan **lokal saja**, karena folder project saat ini sudah berantakan (campuran Next.js, legacy Flask, SQLite lama, file test, dsb).

## 1. Latar Belakang

Aplikasi "Ajuan Pembayaran" versi lama sudah berjalan (Next.js App Router + PostgreSQL, lihat [README.md](README.md)), tapi folder project-nya sudah tidak rapi: bercampur dengan legacy Flask (`script/`), SQLite lama, file hasil test/export, dan struktur yang sulit di-maintain. Daripada dirapikan bertahap, diputuskan untuk **membangun ulang dari nol** dengan struktur bersih dan stack yang disederhanakan, dijalankan **secara lokal saja** (bukan dideploy ke cloud/server production terpisah).

Selain rebuild teknis, ada juga permintaan penyempurnaan proses bisnis: saat ini bagian Keuangan harus memfoto & menginput ulang secara manual setiap ajuan yang diserahkan divisi dalam bentuk kertas. Proses ini ingin disederhanakan lewat fitur baru (lihat Bagian 5).

Dokumen ini adalah **planning tingkat tinggi**, ditujukan untuk dikerjakan oleh programmer (junior/outsource). Detail implementasi teknis (nama variabel, isi kode, dsb.) sengaja tidak dirinci di sini — silakan diputuskan saat implementasi selama mengikuti prinsip dan standar di bawah.

## 2. Tujuan

- Membangun ulang project di folder ini dengan struktur bersih, menggantikan struktur lama yang berantakan.
- Stack: **Next.js (TypeScript)** untuk frontend + backend (API routes), **PostgreSQL** sebagai database utama, **RustFS** sebagai object storage (pengganti Vercel Blob / folder `public/uploads`), seluruhnya dijalankan via **Docker Compose** — **dijalankan secara lokal saja**.
- Tampilan (UI) dibangun ulang lebih rapi dan modern menggunakan **shadcn/ui**, memakai versi terbaru dari seluruh dependency terkait (Next.js, React, shadcn/ui, Tailwind, dsb).
- Mempertahankan seluruh **logika bisnis** dari aplikasi lama persis sama (validasi, perhitungan status/selisih dana, alur approval) — yang diperbarui adalah stack teknis dan tampilan, bukan aturan bisnis lama.
- Data lama **dimigrasi penuh** ke database baru, lalu aplikasi lama **langsung digantikan** (cutover, bukan berjalan paralel).
- Menambahkan proses bisnis baru: pengajuan self-service oleh Divisi dan validasi kelengkapan LPJ sebelum approval (lihat Bagian 5).

## 3. Pembersihan Folder (Langkah Awal — Wajib Sebelum Coding)

Karena folder saat ini berantakan, sebelum mulai coding:

- Arsipkan (pindahkan ke folder `_legacy/` atau backup terpisah, **jangan dihapus permanen** tanpa konfirmasi) semua sisa aplikasi lama yang tidak relevan lagi: `script/` (Flask legacy), `ajuan_pembayaran/` (SQLite lama), `_supabase_import_sql/`, file `_cek_export_test.xlsx`, `tsconfig.tsbuildinfo`, dan file `.bat`/`.txt` yang sudah usang.
- Mulai struktur baru dari kondisi bersih: `src/`, `docker-compose.yml`, `README.md` baru.
- Konfirmasi ke pemilik project sebelum menghapus permanen apa pun — cukup diarsipkan dulu.

## 4. Referensi Fitur Bisnis yang Harus Dipertahankan

Gunakan [README.md](README.md) bagian "Fitur" sebagai acuan domain, mencakup minimal:

- CRUD & validasi data ajuan pembayaran (nama pengaju vs atas nama rekening terpisah).
- Upload bukti transfer -> status otomatis berubah `Selesai Dibayar`.
- Upload LPJ + input realisasi -> hitung otomatis selisih dana (`Surplus`/`Defisit`/`Sesuai`).
- Dashboard rekap (KPI, breakdown status, tren bulanan, top cabang, filter).
- Edit & hapus ajuan dengan konfirmasi, serta audit trail perubahan data.
- Import Excel/CSV data lama & export rekap ke Excel.
- Autentikasi berbasis role (Admin, **Dirkeu** — Direktur Keuangan, punya halaman approval sendiri) beserta alur approval Dirkeu.

## 5. Proses Bisnis Baru: Pengajuan oleh Divisi & Validasi Kelengkapan LPJ

Ini adalah permintaan tambahan (di luar fitur yang sudah ada di aplikasi lama), untuk menghilangkan kerja duplikat di bagian Keuangan.

**Masalah saat ini (proses manual, di luar sistem):**
Setiap divisi mengajukan permintaan pembayaran secara fisik (kertas) ke bagian Keuangan. Staf Keuangan lalu harus memfoto kertas tersebut dan menginput ulang datanya secara manual ke sistem — proses ini duplikatif dan memakan waktu.

**Alur yang diinginkan di sistem baru:**

1. Divisi tetap mengajukan kertas fisik ke Keuangan seperti biasa (proses kertas/tanda tangan fisik dipertahankan, tidak dihapus).
2. Selain kertas, **Divisi menginput sendiri ajuan tersebut ke dalam sistem** (self-service) — menggantikan proses Keuangan yang harus foto & input ulang manual.
3. **Keuangan/Dirkeu baru memproses (approve) ajuan setelah ajuan tsb sudah tercatat di sistem oleh Divisi** — bukan lagi berdasarkan kertas semata.
4. **Divisi juga bisa mengupload LPJ untuk ajuan miliknya sendiri** langsung lewat sistem (self-service, bukan dikerjakan Keuangan).
5. **Aturan validasi baru (LPJ gate):** jika suatu Divisi mengajukan ajuan baru, sementara ajuan sebelumnya dari divisi yang sama **belum ada LPJ yang diupload**, maka ajuan baru tersebut **tidak boleh di-ACC/approve** oleh Keuangan/Dirkeu sampai LPJ ajuan sebelumnya dilengkapi terlebih dahulu.

**Role tambahan yang perlu dirancang:**

- **Divisi**: role baru, **satu akun per divisi** (bukan per pegawai). Setiap divisi punya akses sendiri untuk input ajuan dan upload LPJ, tapi hanya untuk data milik divisinya sendiri (tidak bisa melihat/mengubah data divisi lain).
- **Dirkeu**: tetap seperti di aplikasi lama (halaman approval tersendiri), ditambah wajib menegakkan aturan LPJ gate di atas sebelum approve — sebaiknya ditampilkan jelas di halaman approval-nya (mis. status "LPJ ajuan sebelumnya belum lengkap") agar Dirkeu tidak perlu cek manual.

**Daftar divisi (master data awal):**

1. Organisasi
2. HRD
3. Pendidikan
4. Marketing & Experience (MCX)
5. Keuangan

Catatan: divisi **Keuangan** juga mengajukan ajuan untuk kebutuhannya sendiri seperti divisi lain. Approval untuk ajuan milik divisi Keuangan **tetap dilakukan oleh Dirkeu** — tidak perlu approver alternatif.

## 6. Scope

**In-scope:**
- Rebuild project Next.js (TypeScript) baru dari nol di folder ini, struktur bersih.
- Desain ulang skema database PostgreSQL mengikuti standar Bagian 8, termasuk entitas Divisi dan relasi ajuan-ke-divisi.
- Integrasi RustFS sebagai object storage untuk file upload (bukti transfer, LPJ).
- Setup Docker Compose untuk menjalankan app + PostgreSQL + RustFS secara lokal.
- Rebuild seluruh UI menggunakan shadcn/ui (versi terbaru), dengan logika bisnis yang identik dengan aplikasi lama.
- Role baru **Divisi** untuk input ajuan & upload LPJ self-service, plus aturan LPJ gate sebelum approval (Bagian 5).
- Migrasi **penuh** seluruh data lama (termasuk file bukti transfer & LPJ) ke database/storage baru, diikuti cutover langsung — aplikasi lama dimatikan setelah migrasi selesai & tervalidasi.

**Out-of-scope (untuk iterasi berikutnya):**
- Deployment ke cloud/server production, dan CI/CD otomatis — untuk saat ini aplikasi hanya perlu berjalan lokal via `docker compose up`.
- Digitalisasi proses kertas (tanda tangan digital, dsb.) — proses kertas fisik ke Keuangan tetap berjalan seperti biasa di luar sistem.
- Perubahan pada aturan/alur bisnis lain di luar yang disebutkan di Bagian 5 — logika harus tetap sama seperti aplikasi lama.

## 7. Rencana Kerja (High-Level)

1. **Bersihkan & Inisialisasi Project**
   - Lakukan langkah Bagian 3, lalu init project Next.js (TypeScript) baru.
2. **Desain Skema Database**
   - Petakan seluruh entitas dari aplikasi lama (ajuan, bukti transfer, LPJ, audit trail, user/role, dsb.) ke skema PostgreSQL baru, ikuti standar Bagian 8.
   - Tambahkan entitas **Divisi** (tabel rujukan statis, mis. `lib_divisi`) dan relasikan ke tabel ajuan (setiap ajuan dimiliki oleh satu divisi). Seed data awal: Organisasi, HRD, Pendidikan, Marketing & Experience (MCX), Keuangan.
3. **Setup Docker Compose (Lokal)**
   - Buat `docker-compose.yml` yang menjalankan service: aplikasi Next.js, PostgreSQL, dan RustFS untuk dijalankan di komputer/server lokal, dikelola oleh tim infra.
   - Sertakan volume untuk persistensi data database & object storage antar restart. Backup belum diperlukan di tahap testing lokal ini (lihat Bagian 12).
4. **Integrasi RustFS**
   - Rancang layer akses file (upload/download bukti transfer & LPJ) menggunakan RustFS sebagai storage backend, menggantikan Vercel Blob / `public/uploads`.
5. **Struktur Modul Aplikasi**
   - Rancang pembagian route/module Next.js mengikuti domain bisnis (ajuan, upload bukti, LPJ, dashboard, auth/role, export/import).
6. **UI/Tampilan Baru**
   - Setup shadcn/ui (versi terbaru) sebagai komponen dasar seluruh halaman.
   - Rancang ulang tampilan (form ajuan, dashboard, tabel, upload) supaya lebih modern & rapi, tanpa mengubah logika/aturan bisnis yang sudah berjalan.
7. **Autentikasi & Otorisasi (3 Role)**
   - Rancang mekanisme login & pembedaan role: **Admin**, **Dirkeu** (approval + LPJ gate), dan **Divisi** (input ajuan & LPJ milik sendiri saja).
8. **Modul Divisi: Input Ajuan & LPJ Self-Service**
   - Bangun form input ajuan dan upload LPJ yang bisa diakses langsung oleh Divisi, dengan pembatasan akses hanya ke data divisi sendiri.
9. **Aturan LPJ Gate**
   - Implementasikan validasi: ajuan baru dari suatu divisi tidak bisa di-approve Dirkeu selama ada ajuan sebelumnya (divisi yang sama) yang LPJ-nya belum diupload.
10. **Import/Export Data**
    - Rencanakan ulang fitur import Excel/CSV dan export rekap Excel di stack baru.
11. **Migrasi Data Lama (Wajib, Full Migration)**
    - Susun rencana pemindahan **seluruh** data dari database/versi lama ke skema PostgreSQL baru, termasuk seluruh file bukti transfer & LPJ ke RustFS: mapping tabel/kolom, penanganan data historis, dan validasi kelengkapan hasil migrasi (row count & sampling data harus cocok).
    - Petakan data lama ke divisi yang sesuai (mis. dari kolom cabang/unit yang sudah ada).
12. **Cutover / Go-Live**
    - Rencanakan urutan pemotongan (cutover): freeze input di aplikasi lama -> migrasi final -> validasi -> aplikasi baru live -> aplikasi lama dinonaktifkan. Siapkan rencana rollback singkat jika migrasi gagal di tengah jalan.
13. **Environment & Secret**
    - Susun daftar environment variable yang dibutuhkan (koneksi PostgreSQL, kredensial RustFS, kredensial login, dsb.) mengikuti aturan secret management (Bagian 9).
14. **Testing & Verifikasi**
    - Rencanakan pengujian dasar (unit/integration) untuk fitur kritikal: perhitungan selisih dana, perubahan status otomatis, role-based access (Admin/Dirkeu/Divisi), aturan LPJ gate, dan upload/download file lewat RustFS.
    - Bandingkan hasil kalkulasi & data di aplikasi baru dengan aplikasi lama sebagai bagian dari validasi migrasi.

## 8. Standar Desain Database (Wajib Diikuti — SOP Internal)

- Naming: `snake_case`. Tabel/view pakai prefix `tb_`/`vw_`; tabel rujukan statis (mis. daftar divisi, daftar status) pakai prefix `lib_`.
- Setiap tabel wajib memiliki kolom audit: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by` (soft delete).
- Ikuti normalisasi 1NF–3NF, foreign key wajib ada di setiap relasi (termasuk relasi ajuan -> divisi), indexing pada primary key/foreign key dan kolom yang sering dicari/filter.
- Format tanggal `YYYY-MM-DD`, waktu `HH:MM:SS`.
- Jika ada Stored Procedure/Function: `sp_[aksi]_[objek]`, `fn_[tujuan]_[objek]`.

## 9. Environment & Secret Management (Wajib Diikuti — SOP Internal)

- Dilarang hardcode credential (koneksi PostgreSQL, kredensial RustFS, token, dsb.) di source code maupun di `docker-compose.yml`.
- Gunakan **Infisical** (`infisical.nurulfikri.id`) sebagai satu-satunya platform secret resmi; jalankan aplikasi dengan `infisical run -- <perintah>`.
- Jika terpaksa memakai file `.env` lokal untuk development/Docker, pastikan masuk `.gitignore` dan tidak pernah di-commit.

## 10. Git & Workflow (Wajib Diikuti — SOP Internal)

- Kerjakan di branch baru, bukan langsung ke `main`/`develop`. Gunakan konvensi `feature/[nomor-tiket]-[deskripsi-singkat]` (contoh: `feature/rebuild-nextjs-rustfs`, `feature/divisi-lpj-gate`).
- Commit message mengikuti **Conventional Commits** (`feat`, `fix`, `refactor`, `docs`, `chore`, dst).
- Perubahan masuk lewat Pull Request, wajib direview minimal 1 developer lain sebelum merge.
- Perbarui `README.md` dan `CHANGELOG.md` (format Keep a Changelog + SemVer) begitu struktur baru mulai berjalan.

## 11. Definition of Done

- Folder project bersih dari sisa-sisa lama (sudah diarsipkan sesuai Bagian 3).
- Project baru berjalan lewat `docker compose up` di komputer/server lokal, mencakup app Next.js, PostgreSQL, dan RustFS.
- Seluruh fitur bisnis inti (Bagian 4) berfungsi di stack baru dengan **logika yang identik** dengan aplikasi lama, termasuk upload/download file lewat RustFS.
- Role **Divisi** bisa input ajuan & upload LPJ sendiri; aturan **LPJ gate** (Bagian 5) berjalan dan mencegah approval jika LPJ ajuan sebelumnya belum lengkap.
- UI baru menggunakan shadcn/ui (versi terbaru), tampilan lebih rapi/modern dibanding aplikasi lama.
- Skema database sesuai standar Bagian 8.
- **Seluruh data lama sudah dimigrasi penuh** dan tervalidasi (row count & sampling cocok dengan sumber lama).
- Aplikasi lama sudah dinonaktifkan (cutover selesai), aplikasi baru menjadi satu-satunya yang berjalan.
- Tidak ada credential yang di-hardcode; sudah terhubung ke Infisical atau `.env` yang di-gitignore.
- Dokumentasi (README) diperbarui menjelaskan cara setup & menjalankan lewat Docker Compose secara lokal.

## 12. Risiko & Hal yang Perlu Diklarifikasi

- Waktu yang tepat untuk freeze input di aplikasi lama menjelang migrasi final (perlu koordinasi dengan pengguna Admin/Dirkeu/Divisi supaya tidak ada data yang tertinggal saat cutover).
- `docker compose up` dijalankan dan dikelola oleh **tim infra**. Ini masih tahap testing lokal (belum production), jadi backup belum diperlukan untuk saat ini.
