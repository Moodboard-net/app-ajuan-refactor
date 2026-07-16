-- Rombak role, alur 2 tahap, dan persiapan ajuan publik + profile
-- Lihat issue #7 untuk latar belakang lengkap.

-- 1) Rename role: admin -> super_admin, dirkeu -> approval
--    Role 'divisi' TIDAK dihapus dari enum (Postgres tidak mendukung DROP VALUE
--    dengan mudah); cukup dipensiunkan lewat soft-delete di bawah, dan kode
--    aplikasi tidak lagi pernah membuat/menetapkan role ini.
ALTER TYPE user_role RENAME VALUE 'admin' TO 'super_admin';
ALTER TYPE user_role RENAME VALUE 'dirkeu' TO 'approval';

-- 2) Status baru untuk alur 2 tahap (verifikasi Super Admin -> review Approval)
ALTER TYPE status_ajuan ADD VALUE IF NOT EXISTS 'Menunggu Verifikasi';
ALTER TYPE status_ajuan ADD VALUE IF NOT EXISTS 'Perlu Revisi';

-- 3) Kode tracking untuk ajuan yang masuk lewat form publik (/ajukan).
--    Nullable: ajuan lama (dibuat lewat akun divisi) tidak retroaktif diberi kode.
ALTER TABLE tb_ajuan ADD COLUMN IF NOT EXISTS kode_tracking VARCHAR(12) UNIQUE;

-- 4) Foto profil untuk halaman Profile (object key di RustFS, folder avatar/)
ALTER TABLE tb_user ADD COLUMN IF NOT EXISTS foto_profil_key TEXT;

-- 5) Pensiunkan akun per-divisi: divisi tidak lagi butuh login (lihat issue #7).
--    Ajuan lama milik divisi TIDAK diubah/dihapus, hanya akun login-nya.
UPDATE tb_user
SET deleted_at = now(), updated_at = now()
WHERE role = 'divisi' AND deleted_at IS NULL;
