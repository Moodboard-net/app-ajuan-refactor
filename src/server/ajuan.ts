import "server-only";
import { sql } from "@/server/db";

export type Ajuan = {
  id: number;
  id_divisi: number;
  nama_divisi: string;
  nama_pengaju: string;
  atas_nama_rekening: string;
  nomor_rekening: string;
  nama_bank: string;
  keterangan_kegiatan: string;
  nominal_diajukan: string;
  status: "Menunggu Approval" | "Ditolak" | "Disetujui" | "Selesai Dibayar";
  catatan_approval: string | null;
  created_at: string;
};

export async function listAjuanByDivisi(idDivisi: number): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.id_divisi = ${idDivisi} AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `;
}

export async function listAjuanMenungguApproval(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.status = 'Menunggu Approval' AND a.deleted_at IS NULL
    ORDER BY a.created_at ASC
  `;
}

export async function listAjuanAll(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `;
}

export async function getAjuanById(id: number): Promise<Ajuan | null> {
  const rows = await sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.id = ${id} AND a.deleted_at IS NULL
  `;
  return rows[0] ?? null;
}

export type CreateAjuanInput = {
  idDivisi: number;
  namaPengaju: string;
  atasNamaRekening: string;
  nomorRekening: string;
  namaBank: string;
  keteranganKegiatan: string;
  nominalDiajukan: number;
  createdBy: number;
};

export async function createAjuan(input: CreateAjuanInput): Promise<number> {
  const rows = await sql<{ id: number }[]>`
    INSERT INTO tb_ajuan (
      id_divisi, nama_pengaju, atas_nama_rekening, nomor_rekening,
      nama_bank, keterangan_kegiatan, nominal_diajukan, created_by, updated_by
    ) VALUES (
      ${input.idDivisi}, ${input.namaPengaju}, ${input.atasNamaRekening},
      ${input.nomorRekening}, ${input.namaBank}, ${input.keteranganKegiatan},
      ${input.nominalDiajukan}, ${input.createdBy}, ${input.createdBy}
    )
    RETURNING id
  `;
  return rows[0].id;
}

/**
 * LPJ gate: divisi tidak boleh mendapat approval ajuan baru selama masih
 * punya ajuan lain yang sudah "Selesai Dibayar" tapi belum diupload LPJ-nya.
 */
export async function findAjuanBelumLpj(
  idDivisi: number,
  excludeAjuanId: number
): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.id_divisi = ${idDivisi}
      AND a.id != ${excludeAjuanId}
      AND a.status = 'Selesai Dibayar'
      AND a.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM tb_lpj l WHERE l.id_ajuan = a.id AND l.deleted_at IS NULL
      )
  `;
}

export async function approveAjuan(
  id: number,
  approvedBy: number
): Promise<void> {
  await sql`
    UPDATE tb_ajuan
    SET status = 'Disetujui', id_approved_by = ${approvedBy},
        approved_at = now(), updated_by = ${approvedBy}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function rejectAjuan(
  id: number,
  rejectedBy: number,
  catatan: string
): Promise<void> {
  await sql`
    UPDATE tb_ajuan
    SET status = 'Ditolak', catatan_approval = ${catatan},
        id_approved_by = ${rejectedBy}, approved_at = now(),
        updated_by = ${rejectedBy}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function markSelesaiDibayar(
  id: number,
  updatedBy: number
): Promise<void> {
  await sql`
    UPDATE tb_ajuan
    SET status = 'Selesai Dibayar', updated_by = ${updatedBy}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function insertAuditTrail(
  idAjuan: number,
  idUser: number,
  aksi: string,
  detail: Record<string, string | number | boolean | null>
): Promise<void> {
  await sql`
    INSERT INTO tb_audit_trail (id_ajuan, id_user, aksi, detail, created_by)
    VALUES (${idAjuan}, ${idUser}, ${aksi}, ${sql.json(detail)}, ${idUser})
  `;
}
