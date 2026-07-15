/**
 * Migrasi data lama (aplikasi Next.js + PostgreSQL versi lama) ke skema baru.
 *
 * WAJIB sebelum menjalankan:
 * 1. Isi env `OLD_DATABASE_URL` mengarah ke database PostgreSQL aplikasi lama.
 * 2. Salin `db/divisi-mapping.example.json` -> `db/divisi-mapping.json`, isi
 *    pemetaan nilai `divisi_cabang` lama ke kode divisi baru
 *    (organisasi | hrd | pendidikan | mcx | keuangan). Baris dengan
 *    divisi_cabang yang tidak ada di mapping akan dilewati (skip) dan dicatat.
 * 3. Jika ada `link_bukti_transfer` / `link_lpj` berupa URL Vercel Blob privat,
 *    pastikan token akses masih berlaku, atau unduh file secara manual dan
 *    sesuaikan `downloadLegacyFile` di bawah untuk membaca dari lokasi lokal.
 *
 * Catatan penting (baca sebelum run):
 * - Ajuan lama dengan status_lpj = 'Tidak Wajib' TIDAK dibuatkan baris LPJ di
 *   skema baru (skema baru tidak punya konsep "LPJ tidak wajib"). Ini berarti
 *   ajuan tsb akan dianggap "belum LPJ" oleh LPJ gate jika berstatus setara
 *   Selesai Dibayar. Tinjau data ini secara manual sebelum go-live.
 * - Script ini idempotent secara kasar (pakai audit_trail utk menandai id lama
 *   yang sudah dimigrasi), tapi sebaiknya dijalankan sekali ke database baru
 *   yang kosong.
 */

import fs from "fs";
import path from "path";
import postgres from "postgres";
import { uploadBuffer } from "../src/lib/storage";

const oldSql = postgres(process.env.OLD_DATABASE_URL!, { max: 3 });
const newSql = postgres(process.env.DATABASE_URL!, { max: 3 });

type DivisiMapping = Record<string, string>;

function loadDivisiMapping(): DivisiMapping {
  const mappingPath = path.join(__dirname, "divisi-mapping.json");
  if (!fs.existsSync(mappingPath)) {
    throw new Error(
      "db/divisi-mapping.json belum ada. Salin dari divisi-mapping.example.json dan isi pemetaannya."
    );
  }
  const raw = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
  delete raw._petunjuk;
  return raw;
}

type OldAjuanRow = {
  id_ajuan: string;
  tanggal_ajuan: string;
  nama_pengaju: string;
  nama_penerima_dana: string | null;
  nama_bank: string | null;
  nomor_rekening: string | null;
  perihal: string | null;
  keterangan: string | null;
  divisi_cabang: string;
  nominal: string;
  status: string;
  link_bukti_transfer: string | null;
  status_lpj: string;
  link_lpj: string | null;
  nominal_realisasi: string | null;
  review_status_dirkeu: string;
  created_at: string;
};

function mapStatus(row: OldAjuanRow): string {
  if (row.status === "Selesai Dibayar" || row.status === "Dibayar Tanpa Bukti TF") {
    return "Selesai Dibayar";
  }
  if (row.review_status_dirkeu === "Disetujui Dirkeu") return "Disetujui";
  if (row.review_status_dirkeu === "Ditolak Dirkeu") return "Ditolak";
  return "Menunggu Approval";
}

async function downloadLegacyFile(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal unduh file lama: ${url} (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const divisiMapping = loadDivisiMapping();

  const divisiRows = await newSql<{ id: number; kode: string }[]>`
    SELECT id, kode FROM lib_divisi
  `;
  const idByKode = new Map(divisiRows.map((d) => [d.kode, d.id]));

  const oldRows = await oldSql<OldAjuanRow[]>`
    SELECT id_ajuan, tanggal_ajuan, nama_pengaju, nama_penerima_dana,
           nama_bank, nomor_rekening, perihal, keterangan, divisi_cabang,
           nominal, status, link_bukti_transfer, status_lpj, link_lpj,
           nominal_realisasi, review_status_dirkeu, created_at
    FROM ajuan
    ORDER BY created_at ASC
  `;

  console.log(`Ditemukan ${oldRows.length} ajuan di database lama.`);

  const skipped: string[] = [];
  let migrated = 0;

  for (const row of oldRows) {
    const kode = divisiMapping[row.divisi_cabang];
    const idDivisi = kode ? idByKode.get(kode) : undefined;

    if (!idDivisi) {
      skipped.push(`${row.id_ajuan} (divisi_cabang: "${row.divisi_cabang}" tidak dipetakan)`);
      continue;
    }

    const newStatus = mapStatus(row);
    const keteranganKegiatan =
      [row.perihal, row.keterangan].filter(Boolean).join(" - ") || "-";

    const [{ id: newAjuanId }] = await newSql<{ id: number }[]>`
      INSERT INTO tb_ajuan (
        id_divisi, nama_pengaju, atas_nama_rekening, nomor_rekening,
        nama_bank, keterangan_kegiatan, nominal_diajukan, status, created_at, updated_at
      ) VALUES (
        ${idDivisi}, ${row.nama_pengaju}, ${row.nama_penerima_dana ?? row.nama_pengaju},
        ${row.nomor_rekening ?? "-"}, ${row.nama_bank ?? "-"}, ${keteranganKegiatan},
        ${row.nominal}, ${newStatus}, ${row.created_at}, ${row.created_at}
      )
      RETURNING id
    `;

    await newSql`
      INSERT INTO tb_audit_trail (id_ajuan, aksi, detail)
      VALUES (${newAjuanId}, 'migrasi_data_lama', ${newSql.json({
        idAjuanLama: row.id_ajuan,
      })})
    `;

    if (row.link_bukti_transfer) {
      try {
        const buffer = await downloadLegacyFile(row.link_bukti_transfer);
        const { objectKey, namaFile } = await uploadBuffer(
          "bukti-transfer",
          buffer,
          `${row.id_ajuan}-bukti-transfer`
        );
        await newSql`
          INSERT INTO tb_bukti_transfer (id_ajuan, object_key, nama_file)
          VALUES (${newAjuanId}, ${objectKey}, ${namaFile})
        `;
      } catch (err) {
        skipped.push(`${row.id_ajuan} (gagal migrasi bukti transfer: ${err})`);
      }
    }

    if (row.status_lpj === "Sudah Upload" && row.link_lpj && row.nominal_realisasi) {
      try {
        const buffer = await downloadLegacyFile(row.link_lpj);
        const { objectKey, namaFile } = await uploadBuffer(
          "lpj",
          buffer,
          `${row.id_ajuan}-lpj`
        );
        const nominalDiajukan = Number(row.nominal);
        const nominalRealisasi = Number(row.nominal_realisasi);
        const selisih = nominalDiajukan - nominalRealisasi;
        const statusDana = selisih > 0 ? "Surplus" : selisih < 0 ? "Defisit" : "Sesuai";

        await newSql`
          INSERT INTO tb_lpj (id_ajuan, object_key, nama_file, nominal_realisasi, selisih_dana, status_dana)
          VALUES (${newAjuanId}, ${objectKey}, ${namaFile}, ${nominalRealisasi}, ${selisih}, ${statusDana})
        `;
      } catch (err) {
        skipped.push(`${row.id_ajuan} (gagal migrasi LPJ: ${err})`);
      }
    }

    migrated += 1;
  }

  console.log(`Selesai. Berhasil migrasi: ${migrated}. Dilewati: ${skipped.length}.`);
  if (skipped.length > 0) {
    console.log("Daftar yang dilewati:");
    skipped.forEach((s) => console.log(` - ${s}`));
  }

  await oldSql.end();
  await newSql.end();
}

main().catch(async (err) => {
  console.error(err);
  await oldSql.end();
  await newSql.end();
  process.exit(1);
});
