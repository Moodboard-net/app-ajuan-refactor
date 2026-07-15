# Issue: Polish UI/UX, Ganti Font ke Poppins, dan Restrukturisasi Modular `src/`

> Catatan: dokumen ini menggantikan `issue.md` sebelumnya (rebuild Next.js + PostgreSQL + RustFS + Docker), yang sudah selesai & di-merge lewat [PR #2](https://github.com/Moodboard-net/app-ajuan-refactor/pull/2). Iterasi ini adalah penyempurnaan lanjutan di atas hasil rebuild tersebut — bukan rebuild ulang.

## 1. Latar Belakang

Aplikasi "Ajuan Pembayaran" hasil rebuild sudah berjalan (Next.js + shadcn/ui + PostgreSQL + RustFS, lihat [README.md](README.md)) dan fitur intinya (ajuan, approval, LPJ gate, dashboard) sudah berfungsi. Namun ada 3 hal yang perlu disempurnakan:

1. Tampilan masih memakai font bawaan (Geist) — mau diganti ke **Poppins**.
2. Tampilan dinilai **kurang menarik dan monoton** — perlu dipercantik.
3. Struktur folder `src/` saat ini masih bercampur antara logika client (komponen UI), server (query database, server actions), dan utilitas — perlu dirapikan jadi lebih **modular**.

Dokumen ini adalah **planning tingkat tinggi**, ditujukan untuk dikerjakan oleh programmer junior atau model AI yang lebih murah. Detail implementasi teknis (nama file persis, isi kode, dsb.) sengaja tidak dirinci — silakan diputuskan saat implementasi selama mengikuti prinsip dan standar di bawah, dan **tidak mengubah logika bisnis yang sudah berjalan** (LPJ gate, perhitungan selisih dana, alur approval, dsb.).

## 2. Tujuan

- Mengganti font aplikasi dari Geist ke **Poppins** di seluruh halaman.
- Merombak tampilan (UI/UX) supaya lebih modern, enak dilihat, dan tidak monoton — tanpa mengubah alur/fungsi yang sudah ada.
- Merapikan struktur folder `src/` menjadi modular: pisahkan jelas antara **logika antarmuka (client)**, **pemrosesan server/API**, dan **fungsi utilitas/bisnis**.

## 3. Scope

**In-scope:**
- Ganti font ke Poppins (termasuk seluruh berat/weight yang dipakai: reguler, medium, semibold, dst).
- Perbaikan visual: palet warna, spacing, tipografi, komponen kartu/tabel/badge/tombol, empty state, dan konsistensi antar halaman (login, dashboard admin, approval, form ajuan/LPJ).
- Restrukturisasi folder `src/` sesuai Bagian 5, tanpa mengubah perilaku aplikasi (murni refactor struktur).

**Out-of-scope:**
- Perubahan logika bisnis (LPJ gate, perhitungan selisih dana, alur approval, aturan role).
- Penambahan fitur baru di luar 3 hal di atas.
- Perubahan skema database.

## 4. Rencana Kerja — Font & UI/UX (High-Level)

1. **Ganti Font ke Poppins**
   - Ganti `Geist`/`Geist_Mono` di [src/app/layout.tsx](src/app/layout.tsx) dengan `Poppins` dari `next/font/google`.
   - Terapkan sebagai font utama di seluruh halaman (via CSS variable, konsisten dengan cara Geist dipakai sekarang di `globals.css`).

2. **Audit Tampilan yang Ada**
   - Susuri semua halaman yang sudah ada: login, dashboard admin (`/cek-ajuan`), approval (`/approval`), daftar & detail ajuan (`/ajuan`, `/ajuan/[id]`, `/ajuan/new`), import (`/import-sheet`).
   - Catat bagian yang terasa monoton/kurang rapi (biasanya: kontras warna kurang, semua kartu terlihat sama, tabel polos, tidak ada ikon/aksen visual, empty state seadanya).

3. **Perbaiki Sistem Visual**
   - Perkaya penggunaan varian warna/varian komponen shadcn/ui yang sudah terpasang (Badge, Card, Alert, dsb.) supaya status (Menunggu Approval/Disetujui/Ditolak/Selesai Dibayar, Surplus/Defisit/Sesuai) lebih mudah dibedakan sekilas.
   - Tambahkan ikon (paket `lucide-react` sudah terpasang) pada tombol/aksi penting dan KPI dashboard supaya tidak terlihat polos teks semua.
   - Perbaiki empty state ("Belum ada ajuan", "Tidak ada ajuan menunggu approval") supaya tidak terasa kosong/mentah.
   - Rapikan spacing & hierarki tipografi (judul halaman, label, isi) secara konsisten di semua halaman.

4. **Review Konsistensi**
   - Pastikan seluruh halaman (3 role: Admin, Dirkeu, Divisi) memakai gaya visual yang sama, bukan hanya sebagian yang dipercantik.

## 5. Rencana Kerja — Restrukturisasi Modular `src/` (High-Level)

Struktur target (silakan sesuaikan detail penamaan saat implementasi, prinsip utamanya adalah pemisahan tanggung jawab berikut):

```text
src/
  app/            # HANYA routing: page.tsx, layout.tsx, route.ts (route handler tipis, delegasikan ke server/)
  components/     # Logika antarmuka (client): komponen UI reusable & presentational, termasuk components/ui (shadcn)
  server/         # Pemrosesan server/API: akses database, server actions, integrasi RustFS, auth/session
  lib/            # Fungsi utilitas & logika bisnis murni (format angka/tanggal, perhitungan selisih dana, aturan LPJ gate, dsb.) — tidak bergantung pada Next.js/request
```

1. **Petakan Isi Saat Ini**
   - Isi `src/lib/actions/*.ts` (server actions) dan `src/lib/{ajuan,dashboard,auth,db,storage,password}.ts` (akses database & infra) -> pindah ke `src/server/`.
   - Fungsi murni seperti `src/lib/format.ts`, `src/lib/utils.ts`, serta logika perhitungan bisnis (mis. rumus selisih dana & penentuan status dana yang saat ini nempel di dalam server action) -> pindah/ekstrak ke `src/lib/` sebagai fungsi murni yang bisa dites terpisah dari database.
   - Komponen di dalam folder route (`upload-bukti-form.tsx`, `ajuan-form.tsx`, dst.) tetap boleh colocated dengan halamannya masing-masing (pola Next.js App Router yang wajar), tapi komponen yang dipakai lebih dari satu halaman dipindah ke `src/components/`.

2. **Update Seluruh Import**
   - Sesuaikan semua `import` yang terpengaruh perpindahan file.
   - Pastikan tidak ada file di `src/server/` yang ter-import dari Client Component (jaga batas server/client tetap benar, pertahankan `import "server-only"` yang sudah ada).

3. **Tidak Mengubah Perilaku**
   - Ini murni refactor struktur. Setelah selesai, seluruh alur yang sudah teruji (login 3 role, ajuan → approval → upload bukti transfer → upload LPJ, LPJ gate, dashboard, import/export Excel) harus tetap berjalan identik seperti sebelumnya.

## 6. Standar & Workflow (Wajib Diikuti — SOP Internal)

- Kerjakan di branch baru dari `main`, bukan langsung ke `main`. Gunakan konvensi `feature/[nomor-tiket]-[deskripsi-singkat]` (contoh: `feature/3-ui-polish-poppins-modular`).
- Commit message mengikuti **Conventional Commits** (`feat`, `refactor`, `style`, `docs`, dst). Karena ada 3 pekerjaan berbeda (font, UI/UX, restrukturisasi folder), sebaiknya dipisah jadi beberapa commit logis (bukan satu commit raksasa), meskipun tetap dalam satu PR.
- Perubahan masuk lewat Pull Request, wajib direview minimal 1 developer lain sebelum merge.
- Jalankan `npm run typecheck` dan `npm run lint` sebelum membuka PR — pastikan bersih.
- Uji manual minimal: login tiap role, alur ajuan lengkap sampai LPJ, dan pastikan tampilan baru konsisten di semua halaman.

## 7. Definition of Done

- Seluruh halaman memakai font Poppins, tidak ada sisa font lama.
- Tampilan terasa lebih hidup/modern dibanding sebelumnya (ada variasi visual: warna status, ikon, empty state yang lebih baik), tetap konsisten di semua halaman & role.
- Struktur `src/` sudah mengikuti pemisahan client / server / lib sesuai Bagian 5.
- Tidak ada perubahan pada logika bisnis — seluruh alur yang sudah teruji sebelumnya (lihat PR #2) tetap berjalan sama persis.
- `npm run typecheck`, `npm run lint`, dan `npm run build` lolos tanpa error.

## 8. Risiko & Hal yang Perlu Diklarifikasi

- "Lebih menarik" bersifat subjektif — implementer punya kebebasan mengambil keputusan desain (warna, ikon, layout detail) selama tetap konsisten dan tidak norak; kalau ada referensi desain spesifik yang diinginkan, sebaiknya dibagikan sebelum mulai.
- Restrukturisasi folder berisiko salah pindah/lupa update import — wajib jalankan `npm run typecheck` + uji manual penuh sebelum PR dibuka, jangan hanya mengandalkan review visual.
