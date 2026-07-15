import "server-only";
import { sql } from "@/server/db";

export type StatusBreakdown = {
  status: string;
  jumlah: number;
  total: string;
};

export type DivisiBreakdown = {
  nama: string;
  jumlah: number;
  total: string;
};

export type TrenBulanan = {
  bulan: string;
  jumlah: number;
  total: string;
};

export async function getStatusBreakdown(): Promise<StatusBreakdown[]> {
  return sql<StatusBreakdown[]>`
    SELECT status, count(*)::int AS jumlah, coalesce(sum(nominal_diajukan), 0) AS total
    FROM tb_ajuan
    WHERE deleted_at IS NULL
    GROUP BY status
    ORDER BY status
  `;
}

export async function getTopDivisi(): Promise<DivisiBreakdown[]> {
  return sql<DivisiBreakdown[]>`
    SELECT d.nama, count(*)::int AS jumlah, coalesce(sum(a.nominal_diajukan), 0) AS total
    FROM tb_ajuan a
    JOIN lib_divisi d ON d.id = a.id_divisi
    WHERE a.deleted_at IS NULL
    GROUP BY d.nama
    ORDER BY total DESC
    LIMIT 5
  `;
}

export async function getTrenBulanan(): Promise<TrenBulanan[]> {
  return sql<TrenBulanan[]>`
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bulan,
           count(*)::int AS jumlah,
           coalesce(sum(nominal_diajukan), 0) AS total
    FROM tb_ajuan
    WHERE deleted_at IS NULL
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12
  `;
}

export async function getKpi(): Promise<{
  totalAjuan: number;
  totalNominal: string;
  totalSelesaiDibayar: number;
  totalMenungguApproval: number;
}> {
  const rows = await sql<
    {
      total_ajuan: number;
      total_nominal: string;
      total_selesai_dibayar: number;
      total_menunggu_approval: number;
    }[]
  >`
    SELECT
      count(*)::int AS total_ajuan,
      coalesce(sum(nominal_diajukan), 0) AS total_nominal,
      count(*) FILTER (WHERE status = 'Selesai Dibayar')::int AS total_selesai_dibayar,
      count(*) FILTER (WHERE status = 'Menunggu Approval')::int AS total_menunggu_approval
    FROM tb_ajuan
    WHERE deleted_at IS NULL
  `;

  const row = rows[0];
  return {
    totalAjuan: row.total_ajuan,
    totalNominal: row.total_nominal,
    totalSelesaiDibayar: row.total_selesai_dibayar,
    totalMenungguApproval: row.total_menunggu_approval,
  };
}
