"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import {
  createAjuan,
  getAjuanById,
  approveAjuan,
  rejectAjuan,
  markSelesaiDibayar,
  findAjuanBelumLpj,
  insertAuditTrail,
} from "@/lib/ajuan";

export type ActionState = { error?: string; success?: boolean };

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

  const id = await createAjuan({
    idDivisi: session.idDivisi!,
    namaPengaju: parsed.data.namaPengaju,
    atasNamaRekening: parsed.data.atasNamaRekening,
    nomorRekening: parsed.data.nomorRekening,
    namaBank: parsed.data.namaBank,
    keteranganKegiatan: parsed.data.keteranganKegiatan,
    nominalDiajukan: parsed.data.nominalDiajukan,
    createdBy: session.userId,
  });

  await insertAuditTrail(id, session.userId, "buat_ajuan", {
    nominal: parsed.data.nominalDiajukan,
  });

  redirect("/ajuan");
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

  await markSelesaiDibayar(idAjuan, session.userId);
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
  const selisih = nominalDiajukan - parsed.data.nominalRealisasi;
  const statusDana = selisih > 0 ? "Surplus" : selisih < 0 ? "Defisit" : "Sesuai";

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

  await approveAjuan(idAjuan, session.userId);
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

  await rejectAjuan(parsed.data.idAjuan, session.userId, parsed.data.catatan);
  await insertAuditTrail(parsed.data.idAjuan, session.userId, "reject_ajuan", {
    catatan: parsed.data.catatan,
  });

  revalidatePath("/approval");
  return { success: true };
}
