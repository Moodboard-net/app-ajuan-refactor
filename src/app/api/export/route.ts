import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireRole } from "@/lib/auth";
import { listAjuanAll } from "@/lib/ajuan";

export async function GET() {
  await requireRole("admin", "dirkeu");

  const data = await listAjuanAll();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rekap Ajuan");

  sheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Tanggal", key: "created_at", width: 20 },
    { header: "Divisi", key: "nama_divisi", width: 20 },
    { header: "Nama Pengaju", key: "nama_pengaju", width: 25 },
    { header: "Atas Nama Rekening", key: "atas_nama_rekening", width: 25 },
    { header: "Nomor Rekening", key: "nomor_rekening", width: 20 },
    { header: "Bank", key: "nama_bank", width: 15 },
    { header: "Keterangan Kegiatan", key: "keterangan_kegiatan", width: 35 },
    { header: "Nominal Diajukan", key: "nominal_diajukan", width: 18 },
    { header: "Status", key: "status", width: 18 },
  ];

  for (const row of data) {
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-ajuan-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
