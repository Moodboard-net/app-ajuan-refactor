-- Initial schema for Ajuan Pembayaran (rebuild)
-- Naming convention: snake_case, tb_ = transactional table, lib_ = static reference table
-- Every table carries audit columns: created_at/by, updated_at/by, deleted_at/by (soft delete)

CREATE TYPE user_role AS ENUM ('admin', 'dirkeu', 'divisi');
CREATE TYPE status_ajuan AS ENUM ('Menunggu Approval', 'Ditolak', 'Disetujui', 'Selesai Dibayar');
CREATE TYPE status_dana AS ENUM ('Surplus', 'Defisit', 'Sesuai');

-- Reference table: master data divisi
CREATE TABLE lib_divisi (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kode VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by BIGINT,
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT
);

INSERT INTO lib_divisi (kode, nama) VALUES
    ('organisasi', 'Organisasi'),
    ('hrd', 'HRD'),
    ('pendidikan', 'Pendidikan'),
    ('mcx', 'Marketing & Experience (MCX)'),
    ('keuangan', 'Keuangan');

-- Users: Admin, Dirkeu (single accounts), Divisi (one account per divisi)
CREATE TABLE tb_user (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    id_divisi BIGINT REFERENCES lib_divisi(id),
    nama_lengkap VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by BIGINT,
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT,
    CONSTRAINT chk_user_divisi CHECK (
        (role = 'divisi' AND id_divisi IS NOT NULL) OR
        (role != 'divisi' AND id_divisi IS NULL)
    )
);

CREATE INDEX idx_tb_user_role ON tb_user(role);
CREATE INDEX idx_tb_user_id_divisi ON tb_user(id_divisi);

-- Ajuan pembayaran
CREATE TABLE tb_ajuan (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_divisi BIGINT NOT NULL REFERENCES lib_divisi(id),
    nama_pengaju VARCHAR(150) NOT NULL,
    atas_nama_rekening VARCHAR(150) NOT NULL,
    nomor_rekening VARCHAR(50) NOT NULL,
    nama_bank VARCHAR(100) NOT NULL,
    keterangan_kegiatan TEXT NOT NULL,
    nominal_diajukan NUMERIC(15, 2) NOT NULL,
    status status_ajuan NOT NULL DEFAULT 'Menunggu Approval',
    id_approved_by BIGINT REFERENCES tb_user(id),
    approved_at TIMESTAMPTZ,
    catatan_approval TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT REFERENCES tb_user(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by BIGINT REFERENCES tb_user(id),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES tb_user(id)
);

CREATE INDEX idx_tb_ajuan_id_divisi ON tb_ajuan(id_divisi);
CREATE INDEX idx_tb_ajuan_status ON tb_ajuan(status);
CREATE INDEX idx_tb_ajuan_created_at ON tb_ajuan(created_at);

-- Bukti transfer (upload ke RustFS, kolom object_key menyimpan key di bucket)
CREATE TABLE tb_bukti_transfer (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_ajuan BIGINT NOT NULL REFERENCES tb_ajuan(id),
    object_key TEXT NOT NULL,
    nama_file VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT REFERENCES tb_user(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by BIGINT REFERENCES tb_user(id),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES tb_user(id)
);

CREATE INDEX idx_tb_bukti_transfer_id_ajuan ON tb_bukti_transfer(id_ajuan);

-- LPJ (laporan pertanggungjawaban), upload oleh Divisi
CREATE TABLE tb_lpj (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_ajuan BIGINT NOT NULL REFERENCES tb_ajuan(id),
    object_key TEXT NOT NULL,
    nama_file VARCHAR(255) NOT NULL,
    nominal_realisasi NUMERIC(15, 2) NOT NULL,
    selisih_dana NUMERIC(15, 2) NOT NULL,
    status_dana status_dana NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT REFERENCES tb_user(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by BIGINT REFERENCES tb_user(id),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES tb_user(id)
);

CREATE INDEX idx_tb_lpj_id_ajuan ON tb_lpj(id_ajuan);

-- Audit trail perubahan data ajuan
CREATE TABLE tb_audit_trail (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_ajuan BIGINT REFERENCES tb_ajuan(id),
    id_user BIGINT REFERENCES tb_user(id),
    aksi VARCHAR(50) NOT NULL,
    detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT REFERENCES tb_user(id)
);

CREATE INDEX idx_tb_audit_trail_id_ajuan ON tb_audit_trail(id_ajuan);
