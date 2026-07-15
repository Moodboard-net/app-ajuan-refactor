"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { hitungSelisihDana } from "@/lib/dana";
import type { Ajuan } from "@/models/ajuan";
import type { ActionState } from "@/types";

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

async function findAjuanBelumLpj(
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

/** Dipakai halaman approval untuk menampilkan badge LPJ gate. */
export async function countAjuanBelumLpj(
  idDivisi: number,
  excludeAjuanId: number
): Promise<number> {
  const rows = await findAjuanBelumLpj(idDivisi, excludeAjuanId);
  return rows.length;
}

async function insertAuditTrail(
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

const createAjuanSchema = z.object({
  namaPengaju: z.string().min(1, "Nama pengaju wajib diisi"),
  atasNamaRekening: z.string().min(1, "Atas nama rekening wajib diisi"),
  nomorRekening: z.string().min(1, "Nomor rekening wajib diisi"),
  namaBank: z.string().min(1, "Nama bank wajib diisi"),
  keteranganKegiatan: z.string().min(1, "Keterangan kegiatan wajib diisi"),
  nominalDiajukan: z.coerce.number().positive("Nominal harus lebih dari 0"),
});

export async function createAjuanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("divisi");

  const parsed = createAjuanSchema.safeParse({
    namaPengaju: formData.get("namaPengaju"),
    atasNamaRekening: formData.get("atasNamaRekening"),
    nomorRekening: formData.get("nomorRekening"),
    namaBank: formData.get("namaBank"),
    keteranganKegiatan: formData.get("keteranganKegiatan"),
    nominalDiajukan: formData.get("nominalDiajukan"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const rows = await sql<{ id: number }[]>`
    INSERT INTO tb_ajuan (
      id_divisi, nama_pengaju, atas_nama_rekening, nomor_rekening,
      nama_bank, keterangan_kegiatan, nominal_diajukan, created_by, updated_by
    ) VALUES (
      ${session.idDivisi!}, ${parsed.data.namaPengaju}, ${parsed.data.atasNamaRekening},
      ${parsed.data.nomorRekening}, ${parsed.data.namaBank}, ${parsed.data.keteranganKegiatan},
      ${parsed.data.nominalDiajukan}, ${session.userId}, ${session.userId}
    )
    RETURNING id
  `;
  const id = rows[0].id;

  await insertAuditTrail(id, session.userId, "buat_ajuan", {
    nominal: parsed.data.nominalDiajukan,
  });

  revalidatePath("/ajuan");
  return { success: true };
}

export async function uploadBuktiAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("divisi");
  const idAjuan = Number(formData.get("idAjuan"));
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { error: "File bukti transfer wajib diunggah" };
  }

  const ajuan = await getAjuanById(idAjuan);
  if (!ajuan || ajuan.id_divisi !== session.idDivisi) {
    return { error: "Ajuan tidak ditemukan" };
  }
  if (ajuan.status !== "Disetujui") {
    return { error: "Ajuan belum disetujui Dirkeu" };
  }

  const { objectKey, namaFile } = await uploadFile("bukti-transfer", file);

  await sql`
    INSERT INTO tb_bukti_transfer (id_ajuan, object_key, nama_file, created_by, updated_by)
    VALUES (${idAjuan}, ${objectKey}, ${namaFile}, ${session.userId}, ${session.userId})
  `;

  await sql`
    UPDATE tb_ajuan
    SET status = 'Selesai Dibayar', updated_by = ${session.userId}, updated_at = now()
    WHERE id = ${idAjuan}
  `;
  await insertAuditTrail(idAjuan, session.userId, "upload_bukti_transfer", {
    namaFile,
  });

  revalidatePath(`/ajuan/${idAjuan}`);
  return { success: true };
}

const lpjSchema = z.object({
  idAjuan: z.coerce.number(),
  nominalRealisasi: z.coerce.number().nonnegative("Nominal realisasi tidak valid"),
});

export async function uploadLpjAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("divisi");

  const parsed = lpjSchema.safeParse({
    idAjuan: formData.get("idAjuan"),
    nominalRealisasi: formData.get("nominalRealisasi"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "File LPJ wajib diunggah" };
  }

  const ajuan = await getAjuanById(parsed.data.idAjuan);
  if (!ajuan || ajuan.id_divisi !== session.idDivisi) {
    return { error: "Ajuan tidak ditemukan" };
  }
  if (ajuan.status !== "Selesai Dibayar") {
    return { error: "Ajuan belum berstatus Selesai Dibayar" };
  }

  const nominalDiajukan = Number(ajuan.nominal_diajukan);
  const { selisih, statusDana } = hitungSelisihDana(
    nominalDiajukan,
    parsed.data.nominalRealisasi
  );

  const { objectKey, namaFile } = await uploadFile("lpj", file);

  await sql`
    INSERT INTO tb_lpj (
      id_ajuan, object_key, nama_file, nominal_realisasi,
      selisih_dana, status_dana, created_by, updated_by
    ) VALUES (
      ${parsed.data.idAjuan}, ${objectKey}, ${namaFile}, ${parsed.data.nominalRealisasi},
      ${selisih}, ${statusDana}, ${session.userId}, ${session.userId}
    )
  `;

  await insertAuditTrail(parsed.data.idAjuan, session.userId, "upload_lpj", {
    nominalRealisasi: parsed.data.nominalRealisasi,
    statusDana,
  });

  revalidatePath(`/ajuan/${parsed.data.idAjuan}`);
  return { success: true };
}

export async function approveAjuanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("dirkeu");
  const idAjuan = Number(formData.get("idAjuan"));

  const ajuan = await getAjuanById(idAjuan);
  if (!ajuan) return { error: "Ajuan tidak ditemukan" };

  const belumLpj = await findAjuanBelumLpj(ajuan.id_divisi, idAjuan);
  if (belumLpj.length > 0) {
    return {
      error: `Tidak bisa disetujui: divisi ${ajuan.nama_divisi} masih punya ${belumLpj.length} ajuan yang belum diupload LPJ-nya`,
    };
  }

  await sql`
    UPDATE tb_ajuan
    SET status = 'Disetujui', id_approved_by = ${session.userId},
        approved_at = now(), updated_by = ${session.userId}, updated_at = now()
    WHERE id = ${idAjuan}
  `;
  await insertAuditTrail(idAjuan, session.userId, "approve_ajuan", {});

  revalidatePath("/approval");
  return { success: true };
}

const rejectSchema = z.object({
  idAjuan: z.coerce.number(),
  catatan: z.string().min(1, "Catatan penolakan wajib diisi"),
});

export async function rejectAjuanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("dirkeu");

  const parsed = rejectSchema.safeParse({
    idAjuan: formData.get("idAjuan"),
    catatan: formData.get("catatan"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await sql`
    UPDATE tb_ajuan
    SET status = 'Ditolak', catatan_approval = ${parsed.data.catatan},
        id_approved_by = ${session.userId}, approved_at = now(),
        updated_by = ${session.userId}, updated_at = now()
    WHERE id = ${parsed.data.idAjuan}
  `;
  await insertAuditTrail(parsed.data.idAjuan, session.userId, "reject_ajuan", {
    catatan: parsed.data.catatan,
  });

  revalidatePath("/approval");
  return { success: true };
}

export async function createAjuanFromImport(input: {
  idDivisi: number;
  namaPengaju: string;
  atasNamaRekening: string;
  nomorRekening: string;
  namaBank: string;
  keteranganKegiatan: string;
  nominalDiajukan: number;
  createdBy: number;
}): Promise<void> {
  await sql`
    INSERT INTO tb_ajuan (
      id_divisi, nama_pengaju, atas_nama_rekening, nomor_rekening,
      nama_bank, keterangan_kegiatan, nominal_diajukan, created_by, updated_by
    ) VALUES (
      ${input.idDivisi}, ${input.namaPengaju}, ${input.atasNamaRekening},
      ${input.nomorRekening}, ${input.namaBank}, ${input.keteranganKegiatan},
      ${input.nominalDiajukan}, ${input.createdBy}, ${input.createdBy}
    )
  `;
}
