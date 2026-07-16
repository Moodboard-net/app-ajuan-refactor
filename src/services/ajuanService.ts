"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { hitungSelisihDana } from "@/lib/dana";
import { generateTrackingCode } from "@/lib/tracking-code";
import type { Ajuan } from "@/models/ajuan";
import type { ActionState } from "@/types";

/** Publik: dipakai form ajuan (/ajukan) dan halaman verifikasi Super Admin. */
export async function listDivisiOptions() {
  return sql<{ id: number; nama: string }[]>`
    SELECT id, nama FROM lib_divisi ORDER BY nama
  `;
}

export async function listAjuanAll(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `;
}

export async function listAjuanMenungguVerifikasi(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.status IN ('Menunggu Verifikasi', 'Perlu Revisi', 'Ditolak')
      AND a.deleted_at IS NULL
    ORDER BY a.created_at ASC
  `;
}

export async function listAjuanMenungguApproval(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.status = 'Menunggu Approval' AND a.deleted_at IS NULL
    ORDER BY a.created_at ASC
  `;
}

export async function listAjuanSiapBayar(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.status = 'Disetujui' AND a.deleted_at IS NULL
    ORDER BY a.approved_at ASC
  `;
}

/** Dipakai jalur cadangan upload LPJ oleh Super Admin di halaman Verifikasi. */
export async function listAjuanSelesaiTanpaLpj(): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.status = 'Selesai Dibayar'
      AND a.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM tb_lpj l WHERE l.id_ajuan = a.id AND l.deleted_at IS NULL
      )
    ORDER BY a.created_at DESC
  `;
}

export async function getAjuanById(id: number): Promise<Ajuan | null> {
  const rows = await sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.id = ${id} AND a.deleted_at IS NULL
  `;
  return rows[0] ?? null;
}

export async function getAjuanByTrackingCode(kode: string): Promise<Ajuan | null> {
  const rows = await sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.kode_tracking = ${kode.toUpperCase()} AND a.deleted_at IS NULL
  `;
  return rows[0] ?? null;
}

export type LacakState = ActionState & { ajuan?: Ajuan; sudahAdaLpj?: boolean };

/** Publik: dipakai halaman /lacak untuk mencari ajuan lewat kode tracking. */
export async function lookupAjuanByTrackingAction(
  _prevState: LacakState,
  formData: FormData
): Promise<LacakState> {
  const kode = String(formData.get("kodeTracking") ?? "").trim();
  if (!kode) {
    return { error: "Kode tracking wajib diisi" };
  }

  const ajuan = await getAjuanByTrackingCode(kode);
  if (!ajuan) {
    return { error: "Kode tracking tidak ditemukan" };
  }

  return { success: true, ajuan, sudahAdaLpj: await hasLpj(ajuan.id) };
}

export async function hasLpj(idAjuan: number): Promise<boolean> {
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM tb_lpj WHERE id_ajuan = ${idAjuan} AND deleted_at IS NULL
    ) AS exists
  `;
  return rows[0].exists;
}

async function findAjuanBelumLpj(
  idDivisi: number,
  excludeAjuanId: number
): Promise<Ajuan[]> {
  return sql<Ajuan[]>`
    SELECT a.id, a.id_divisi, d.nama AS nama_divisi, a.nama_pengaju,
           a.atas_nama_rekening, a.nomor_rekening, a.nama_bank,
           a.keterangan_kegiatan, a.nominal_diajukan, a.status,
           a.catatan_approval, a.kode_tracking, a.created_at
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
  idUser: number | null,
  aksi: string,
  detail: Record<string, string | number | boolean | null>
): Promise<void> {
  await sql`
    INSERT INTO tb_audit_trail (id_ajuan, id_user, aksi, detail, created_by)
    VALUES (${idAjuan}, ${idUser}, ${aksi}, ${sql.json(detail)}, ${idUser})
  `;
}

const ajuanFieldsSchema = {
  idDivisi: z.coerce.number().positive("Divisi wajib dipilih"),
  namaPengaju: z.string().min(1, "Nama pengaju wajib diisi"),
  atasNamaRekening: z.string().min(1, "Atas nama rekening wajib diisi"),
  nomorRekening: z.string().min(1, "Nomor rekening wajib diisi"),
  namaBank: z.string().min(1, "Nama bank wajib diisi"),
  keteranganKegiatan: z.string().min(1, "Keterangan kegiatan wajib diisi"),
  nominalDiajukan: z.coerce.number().positive("Nominal harus lebih dari 0"),
};

const createAjuanPublicSchema = z.object(ajuanFieldsSchema);

export type PublicAjuanState = ActionState & { trackingCode?: string };

/** Publik, tanpa login: form /ajukan. */
export async function createAjuanPublicAction(
  _prevState: PublicAjuanState,
  formData: FormData
): Promise<PublicAjuanState> {
  const parsed = createAjuanPublicSchema.safeParse({
    idDivisi: formData.get("idDivisi"),
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

  let kodeTracking = "";
  let id: number | null = null;

  for (let attempt = 0; attempt < 5 && id === null; attempt++) {
    kodeTracking = generateTrackingCode();
    try {
      const rows = await sql<{ id: number }[]>`
        INSERT INTO tb_ajuan (
          id_divisi, nama_pengaju, atas_nama_rekening, nomor_rekening,
          nama_bank, keterangan_kegiatan, nominal_diajukan, status, kode_tracking
        ) VALUES (
          ${parsed.data.idDivisi}, ${parsed.data.namaPengaju}, ${parsed.data.atasNamaRekening},
          ${parsed.data.nomorRekening}, ${parsed.data.namaBank}, ${parsed.data.keteranganKegiatan},
          ${parsed.data.nominalDiajukan}, 'Menunggu Verifikasi', ${kodeTracking}
        )
        RETURNING id
      `;
      id = rows[0].id;
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "23505") {
        continue; // tabrakan kode tracking, coba lagi
      }
      throw err;
    }
  }

  if (id === null) {
    return { error: "Gagal membuat kode tracking, silakan coba lagi" };
  }

  await insertAuditTrail(id, null, "buat_ajuan_publik", {
    nominal: parsed.data.nominalDiajukan,
  });

  return { success: true, trackingCode: kodeTracking };
}

const submitToApprovalSchema = z.object({
  id: z.coerce.number(),
  ...ajuanFieldsSchema,
});

/** Super Admin: koreksi data ajuan hasil verifikasi lalu ajukan ke Approval. */
export async function submitToApprovalAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("super_admin");

  const parsed = submitToApprovalSchema.safeParse({
    id: formData.get("id"),
    idDivisi: formData.get("idDivisi"),
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

  const ajuan = await getAjuanById(parsed.data.id);
  if (!ajuan) return { error: "Ajuan tidak ditemukan" };
  if (!["Menunggu Verifikasi", "Perlu Revisi", "Ditolak"].includes(ajuan.status)) {
    return { error: "Ajuan sudah diproses, tidak bisa diajukan lagi" };
  }

  await sql`
    UPDATE tb_ajuan
    SET id_divisi = ${parsed.data.idDivisi},
        nama_pengaju = ${parsed.data.namaPengaju},
        atas_nama_rekening = ${parsed.data.atasNamaRekening},
        nomor_rekening = ${parsed.data.nomorRekening},
        nama_bank = ${parsed.data.namaBank},
        keterangan_kegiatan = ${parsed.data.keteranganKegiatan},
        nominal_diajukan = ${parsed.data.nominalDiajukan},
        status = 'Menunggu Approval',
        catatan_approval = NULL,
        updated_by = ${session.userId},
        updated_at = now()
    WHERE id = ${parsed.data.id}
  `;

  await insertAuditTrail(parsed.data.id, session.userId, "ajukan_ke_approval", {});

  revalidatePath("/verifikasi");
  revalidatePath("/approval");
  return { success: true };
}

export async function approveAjuanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("approval");
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

const catatanSchema = z.object({
  idAjuan: z.coerce.number(),
  catatan: z.string().min(1, "Catatan wajib diisi"),
});

export async function rejectAjuanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("approval");

  const parsed = catatanSchema.safeParse({
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

export async function reviseAjuanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("approval");

  const parsed = catatanSchema.safeParse({
    idAjuan: formData.get("idAjuan"),
    catatan: formData.get("catatan"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await sql`
    UPDATE tb_ajuan
    SET status = 'Perlu Revisi', catatan_approval = ${parsed.data.catatan},
        id_approved_by = ${session.userId}, approved_at = now(),
        updated_by = ${session.userId}, updated_at = now()
    WHERE id = ${parsed.data.idAjuan}
  `;
  await insertAuditTrail(parsed.data.idAjuan, session.userId, "revise_ajuan", {
    catatan: parsed.data.catatan,
  });

  revalidatePath("/approval");
  revalidatePath("/verifikasi");
  return { success: true };
}

export async function uploadBuktiAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("approval");
  const idAjuan = Number(formData.get("idAjuan"));
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { error: "File bukti transfer wajib diunggah" };
  }

  const ajuan = await getAjuanById(idAjuan);
  if (!ajuan) {
    return { error: "Ajuan tidak ditemukan" };
  }
  if (ajuan.status !== "Disetujui") {
    return { error: "Ajuan belum disetujui" };
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

  revalidatePath("/approval");
  return { success: true };
}

const lpjSchema = z.object({
  idAjuan: z.coerce.number(),
  nominalRealisasi: z.coerce.number().nonnegative("Nominal realisasi tidak valid"),
});

async function insertLpj(
  idAjuan: number,
  nominalRealisasi: number,
  file: File,
  actorUserId: number | null
): Promise<ActionState> {
  const ajuan = await getAjuanById(idAjuan);
  if (!ajuan) return { error: "Ajuan tidak ditemukan" };
  if (ajuan.status !== "Selesai Dibayar") {
    return { error: "Ajuan belum berstatus Selesai Dibayar" };
  }
  if (await hasLpj(idAjuan)) {
    return { error: "LPJ untuk ajuan ini sudah pernah diunggah" };
  }

  const nominalDiajukan = Number(ajuan.nominal_diajukan);
  const { selisih, statusDana } = hitungSelisihDana(nominalDiajukan, nominalRealisasi);
  const { objectKey, namaFile } = await uploadFile("lpj", file);

  await sql`
    INSERT INTO tb_lpj (
      id_ajuan, object_key, nama_file, nominal_realisasi,
      selisih_dana, status_dana, created_by, updated_by
    ) VALUES (
      ${idAjuan}, ${objectKey}, ${namaFile}, ${nominalRealisasi},
      ${selisih}, ${statusDana}, ${actorUserId}, ${actorUserId}
    )
  `;

  await insertAuditTrail(idAjuan, actorUserId, "upload_lpj", {
    nominalRealisasi,
    statusDana,
  });

  return { success: true };
}

/** Publik: upload LPJ lewat halaman /lacak dengan kode tracking. */
export async function uploadLpjPublicAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = lpjSchema.safeParse({
    idAjuan: formData.get("idAjuan"),
    nominalRealisasi: formData.get("nominalRealisasi"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const kodeTracking = String(formData.get("kodeTracking") ?? "");
  const ajuan = await getAjuanByTrackingCode(kodeTracking);
  if (!ajuan || Number(ajuan.id) !== parsed.data.idAjuan) {
    return { error: "Kode tracking tidak valid" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "File LPJ wajib diunggah" };
  }

  return insertLpj(parsed.data.idAjuan, parsed.data.nominalRealisasi, file, null);
}

/** Super Admin: jalur cadangan upload LPJ bila pengaju kehilangan kode tracking. */
export async function uploadLpjAdminAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("super_admin");

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

  const result = await insertLpj(
    parsed.data.idAjuan,
    parsed.data.nominalRealisasi,
    file,
    session.userId
  );
  revalidatePath("/verifikasi");
  return result;
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
