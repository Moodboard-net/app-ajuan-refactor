# Issue: Manajemen User (Admin), Form Jadi Modal, dan Modularisasi Lanjutan `src/`

> Catatan: dokumen ini menggantikan `issue.md` sebelumnya (Poppins, UI/UX polish, restrukturisasi modular), yang sudah selesai & di-merge lewat [PR #4](https://github.com/Moodboard-net/app-ajuan-refactor/pull/4). Iterasi ini adalah penyempurnaan lanjutan — bukan rebuild ulang.

## 1. Latar Belakang

Aplikasi "Ajuan Pembayaran" sudah berjalan dengan 3 role (Admin, Dirkeu, Divisi) dan struktur folder modular (`src/app`, `src/components`, `src/server`, `src/lib`, lihat [README.md](README.md)). Saat ini akun user (Admin, Dirkeu, 5 akun Divisi) hanya bisa dibuat lewat script `npm run db:seed` — tidak ada UI untuk mengelolanya. Selain itu:

1. Admin perlu bisa **melihat, menambahkan, dan mengedit user** langsung dari aplikasi (tanpa perlu akses database/script).
2. Semua form yang saat ini berbentuk halaman terpisah (ajuan baru, upload bukti transfer, upload LPJ, import Excel, tolak ajuan) ingin diubah jadi **modal** — muncul di atas halaman yang sedang dibuka, bukan pindah halaman.
3. Struktur `src/` ingin dirapikan lebih lanjut mengikuti pola `lib/ (koneksi & auth) / models/ (bentuk data) / services/ (logika bisnis) / types/ (tipe bersama)` — melanjutkan modularisasi yang sudah dimulai di PR #4.

Dokumen ini adalah **planning tingkat tinggi**, ditujukan untuk dikerjakan oleh programmer junior atau model AI yang lebih murah. Detail implementasi teknis (nama file persis, isi kode, dsb.) sengaja tidak dirinci — silakan diputuskan saat implementasi selama mengikuti prinsip di bawah, dan **tidak mengubah logika bisnis yang sudah berjalan** (LPJ gate, perhitungan selisih dana, alur approval, dsb.).

## 2. Tujuan

- Admin bisa mengelola user (Admin, Dirkeu, Divisi) langsung dari UI: lihat daftar, tambah baru, edit yang sudah ada.
- Seluruh form input diubah dari halaman terpisah menjadi modal di atas halaman asal.
- Struktur `src/` dipecah lebih rinci: `lib/` (koneksi database & logika auth), `models/` (bentuk/tipe data per entitas), `services/` (logika bisnis & akses data per entitas), `types/` (tipe/interface bersama).

## 3. Scope

**In-scope:**
- Halaman/manajemen user untuk Admin: list, tambah, edit user (lihat Bagian 4).
- Konversi seluruh form yang ada saat ini menjadi modal (lihat Bagian 5).
- Restrukturisasi lanjutan `src/` mengikuti pola `lib/models/services/types` (lihat Bagian 6).

**Out-of-scope:**
- Hapus user (tidak diminta — cukup lihat, tambah, edit).
- Perubahan logika bisnis (LPJ gate, perhitungan selisih dana, alur approval, aturan role) — hanya boleh berubah cara datanya dikelola (UI/struktur), bukan aturannya.
- Perubahan skema database di luar yang diperlukan untuk fitur ini (tabel `tb_user` sudah ada, cukup dipakai).

## 4. Rencana Kerja — Manajemen User (Admin)

1. **Halaman Daftar User**
   - Tambahkan halaman baru khusus Admin (mis. `/users`), berisi tabel semua user: username, nama lengkap, role, divisi (jika role Divisi).
   - Tambahkan link/menu ke halaman ini di header aplikasi, hanya tampil untuk Admin.

2. **Tambah User (Modal)**
   - Tombol "Tambah User" membuka modal berisi form: username, password awal, nama lengkap, role (Admin/Dirkeu/Divisi), dan pilihan divisi (**hanya muncul/wajib diisi kalau role = Divisi** — sesuai constraint yang sudah ada di skema `tb_user`).
   - Password baru wajib di-hash (pakai fungsi hashing yang sudah ada di project, jangan simpan plain text).

3. **Edit User (Modal)**
   - Tombol "Edit" per baris membuka modal serupa, berisi data user tsb. Field yang bisa diedit: nama lengkap, role, divisi, dan password (opsional — lihat poin Reset Password di bawah).
   - Username sebaiknya tidak bisa diubah setelah dibuat (jadi identitas login yang stabil) — kecuali ada alasan kuat untuk mengizinkannya.
   - **Ganti role diperbolehkan** (mis. dari Divisi jadi Dirkeu, atau sebaliknya). Saat role diganti ke selain Divisi, kolom `id_divisi` wajib dikosongkan (`NULL`); saat role diganti jadi Divisi, form wajib meminta pilihan divisi. Ini mengikuti constraint yang sudah ada di skema `tb_user` (lihat poin Validasi di bawah).

4. **Reset Password (Rekomendasi)**
   - Field password di form edit bersifat **opsional** — dikosongkan berarti password tidak berubah, diisi berarti password langsung diganti (di-hash sebelum disimpan, seperti saat membuat user baru).
   - Tidak perlu alur konfirmasi tambahan (mis. kirim email reset) — aplikasi ini belum punya infrastruktur email/notifikasi, dan menambahkannya di luar scope iterasi ini. Alur "admin set password baru langsung" sudah cukup untuk kebutuhan aplikasi internal seperti ini.
   - Sebagai jejak audit, catat aksi reset password ke `tb_audit_trail` (mis. aksi `reset_password_user`, tanpa menyertakan password itu sendiri) — supaya ada rekam jejak siapa mengganti password siapa dan kapan.

5. **Validasi**
   - Ikuti constraint yang sudah ada: user role Divisi wajib punya `id_divisi`, role lain tidak boleh punya `id_divisi` — berlaku juga saat role diganti lewat edit, bukan cuma saat user dibuat.
   - Username harus unik (sudah ada constraint `UNIQUE` di database, tinggal tangani error-nya di form dengan pesan yang jelas).

## 5. Rencana Kerja — Form Jadi Modal

Ubah seluruh form berikut dari halaman terpisah menjadi modal (memakai komponen `Dialog` dari shadcn/ui yang sudah terpasang di `components/ui/dialog.tsx`):

- **Ajuan Baru** (`/ajuan/new`) -> jadi modal yang dibuka dari tombol "Ajuan Baru" di halaman daftar ajuan Divisi.
- **Upload Bukti Transfer** & **Upload LPJ** (saat ini kartu di halaman detail ajuan) -> jadi modal yang dibuka dari tombol di halaman detail/daftar ajuan.
- **Import Excel** (`/import-sheet`) -> jadi modal yang dibuka dari tombol "Import Excel" di dashboard Admin.
- **Form Tolak Ajuan** (saat ini textarea yang muncul inline di halaman approval) -> jadi modal.
- **Tambah/Edit User** (fitur baru di Bagian 4) -> langsung dibangun sebagai modal sejak awal.

**Yang TIDAK perlu jadi modal:**
- Halaman **Login** — ini halaman masuk aplikasi itu sendiri, bukan form di atas halaman lain.

Setelah dikonversi, halaman/route lama yang jadi tidak terpakai (mis. `/ajuan/new`, `/import-sheet`) boleh dihapus jika sudah tidak ada yang mengarah ke sana — pastikan dicek dulu tidak ada link lain yang rusak.

## 6. Rencana Kerja — Modularisasi Lanjutan `src/`

Lanjutan dari restrukturisasi PR #4 (yang memisahkan `server/` dari `lib/`). Sekarang dipecah lebih rinci:

```text
src/
  app/            # HANYA routing: page.tsx, layout.tsx, route.ts (termasuk app/api/ untuk endpoint backend)
  components/     # Komponen UI reusable, termasuk modal/dialog form & shadcn/ui
  lib/            # Koneksi dasar & infra: koneksi database, logika sesi/auth (login, cookie, verifikasi role)
  models/         # Bentuk/tipe data per entitas sesuai tabel database (User, Ajuan, BuktiTransfer, Lpj, dst.)
  services/       # Logika bisnis & akses data per entitas: query database, perhitungan, server actions
                  # (userService, ajuanService, dashboardService, dsb. — pindahan dari isi src/server/ saat ini)
  types/          # Tipe/interface bersama yang dipakai lintas modul (mis. Role, ActionState)
```

1. **Petakan Isi `src/server/` Saat Ini**
   - `src/server/db.ts` -> `src/lib/db.ts` (koneksi database).
   - `src/server/auth.ts` (session/cookie/JWT) -> `src/lib/auth.ts`.
   - `src/server/{ajuan,dashboard}.ts` (query database per entitas) dan `src/server/actions/*.ts` (server actions/mutasi) -> gabungkan jadi `src/services/{ajuan,dashboard,user}Service.ts` per entitas.
   - `src/server/storage.ts`, `src/server/password.ts` -> boleh tetap di `lib/` (infra dasar) atau masuk `services/` kalau dirasa lebih pas sebagai bagian dari userService/ajuanService — silakan diputuskan saat implementasi, prinsip utamanya: `lib/` untuk infra dasar generik, `services/` untuk logika yang spesifik ke satu entitas bisnis.
   - Tipe-tipe yang saat ini tersebar (`Role` di auth, `Ajuan` di query, `ActionState` di tiap action) -> kumpulkan yang dipakai lintas modul ke `src/types/`.

2. **Update Seluruh Import**
   - Sesuaikan semua `import` yang terpengaruh perpindahan file.
   - Jaga batas server/client tetap benar (pertahankan `import "server-only"` di file yang memang server-only).

3. **Tidak Mengubah Perilaku**
   - Ini murni refactor struktur (kecuali bagian yang memang menambah fitur baru di Bagian 4 & 5). Setelah selesai, seluruh alur yang sudah teruji (login 3 role, ajuan -> approval -> upload bukti transfer -> upload LPJ, LPJ gate, dashboard, import/export Excel) harus tetap berjalan identik.

## 7. Standar & Workflow (Wajib Diikuti — SOP Internal)

- Kerjakan di branch baru dari `main`. Gunakan konvensi `feature/[nomor-tiket]-[deskripsi-singkat]`.
- Commit message mengikuti **Conventional Commits**, dipisah jadi beberapa commit logis (fitur user management, konversi modal, restrukturisasi folder) meskipun tetap dalam satu PR.
- Perubahan masuk lewat Pull Request, wajib direview minimal 1 developer lain sebelum merge.
- Password user baru/reset wajib di-hash, jangan pernah disimpan atau di-log dalam bentuk plain text.
- Jalankan `npm run typecheck` dan `npm run lint` sebelum membuka PR — pastikan bersih.
- Uji manual minimal: Admin bisa tambah & edit user dari UI, seluruh form yang dikonversi tetap berfungsi sebagai modal, dan alur bisnis existing (LPJ gate, dsb.) tidak berubah.

## 8. Definition of Done

- Admin bisa melihat daftar user, menambah user baru, dan mengedit user yang ada — semuanya lewat UI (bukan script).
- Seluruh form yang disebut di Bagian 5 sudah berbentuk modal, bukan halaman terpisah.
- Struktur `src/` sudah mengikuti pemisahan `lib/models/services/types` sesuai Bagian 6.
- Tidak ada perubahan pada logika bisnis existing — seluruh alur yang sudah teruji sebelumnya tetap berjalan sama persis.
- `npm run typecheck`, `npm run lint`, dan `npm run build` lolos tanpa error.

## 9. Risiko & Hal yang Perlu Diklarifikasi

- Setelah form dikonversi ke modal, pastikan sudah tidak ada link/navigasi lain (menu, breadcrumb, dsb.) yang masih mengarah ke route halaman lama sebelum route tsb dihapus.
- Saat Admin mengganti role user yang sedang login (mis. Admin mengubah role dirinya sendiri, atau menonaktifkan akses Dirkeu yang sedang dipakai), sesi user tsb kemungkinan masih menyimpan role lama sampai login ulang — bukan masalah keamanan besar untuk aplikasi internal ini, tapi baik untuk diketahui saat testing.
