"use server";

import ExcelJS from "exceljs";
import { requireRole } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createAjuanFromImport } from "@/services/ajuanService";

export type ImportState = {
  error?: string;
  success?: boolean;
  imported?: number;
  skipped?: string[];
};

export async function importSheetAction(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const session = await requireRole("super_admin");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "File Excel wajib diunggah" };
  }

  const divisiRows = await sql<{ id: number; kode: string; nama: string }[]>`
    SELECT id, kode, nama FROM lib_divisi
  `;
  const divisiMap = new Map<string, number>();
  for (const d of divisiRows) {
    divisiMap.set(d.kode.toLowerCase(), d.id);
    divisiMap.set(d.nama.toLowerCase(), d.id);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return { error: "Sheet Excel kosong atau tidak valid" };
  }

  type ParsedRow = {
    rowNumber: number;
    idDivisi?: number;
    namaPengaju: string;
    atasNamaRekening: string;
    nomorRekening: string;
    namaBank: string;
    keteranganKegiatan: string;
    nominalDiajukan: number;
  };

  const parsedRows: ParsedRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header

    const divisiCell = String(row.getCell(1).value ?? "").trim().toLowerCase();
    parsedRows.push({
      rowNumber,
      idDivisi: divisiMap.get(divisiCell),
      namaPengaju: String(row.getCell(2).value ?? "").trim(),
      atasNamaRekening: String(row.getCell(3).value ?? "").trim(),
      nomorRekening: String(row.getCell(4).value ?? "").trim(),
      namaBank: String(row.getCell(5).value ?? "").trim(),
      keteranganKegiatan: String(row.getCell(6).value ?? "").trim(),
      nominalDiajukan: Number(row.getCell(7).value ?? 0),
    });
  });

  let imported = 0;
  const skipped: string[] = [];

  for (const row of parsedRows) {
    if (!row.idDivisi || !row.namaPengaju || !row.nominalDiajukan) {
      skipped.push(`Baris ${row.rowNumber}`);
      continue;
    }

    try {
      await createAjuanFromImport({
        idDivisi: row.idDivisi,
        namaPengaju: row.namaPengaju,
        atasNamaRekening: row.atasNamaRekening,
        nomorRekening: row.nomorRekening,
        namaBank: row.namaBank,
        keteranganKegiatan: row.keteranganKegiatan,
        nominalDiajukan: row.nominalDiajukan,
        createdBy: session.userId,
      });
      imported += 1;
    } catch {
      skipped.push(`Baris ${row.rowNumber}`);
    }
  }

  return { success: true, imported, skipped };
}
