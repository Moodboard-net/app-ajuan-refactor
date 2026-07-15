import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listAjuanAll } from "@/lib/ajuan";
import { getKpi, getStatusBreakdown, getTopDivisi, getTrenBulanan } from "@/lib/dashboard";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CekAjuanPage() {
  await requireRole("admin");

  const [kpi, statusBreakdown, topDivisi, tren, ajuanList] = await Promise.all([
    getKpi(),
    getStatusBreakdown(),
    getTopDivisi(),
    getTrenBulanan(),
    listAjuanAll(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard Cek Ajuan</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/import-sheet">Import Excel</Link>}
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/api/export">Export Excel</a>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Ajuan</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{kpi.totalAjuan}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Nominal</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatRupiah(kpi.totalNominal)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Selesai Dibayar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpi.totalSelesaiDibayar}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Menunggu Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpi.totalMenungguApproval}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {statusBreakdown.map((row) => (
              <div key={row.status} className="flex items-center justify-between">
                <StatusBadge status={row.status} />
                <span>
                  {row.jumlah} &middot; {formatRupiah(row.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Divisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topDivisi.map((row) => (
              <div key={row.nama} className="flex items-center justify-between">
                <span>{row.nama}</span>
                <span>
                  {row.jumlah} &middot; {formatRupiah(row.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tren.map((row) => (
              <div key={row.bulan} className="flex items-center justify-between">
                <span>{row.bulan}</span>
                <span>
                  {row.jumlah} &middot; {formatRupiah(row.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua Ajuan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Pengaju</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ajuanList.map((ajuan) => (
                <TableRow key={ajuan.id}>
                  <TableCell>{formatDate(ajuan.created_at)}</TableCell>
                  <TableCell>{ajuan.nama_divisi}</TableCell>
                  <TableCell>{ajuan.nama_pengaju}</TableCell>
                  <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
                  <TableCell>
                    <StatusBadge status={ajuan.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
