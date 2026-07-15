import { FileStack, Wallet, CheckCircle2, Clock, Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listAjuanAll } from "@/services/ajuanService";
import { getKpi, getStatusBreakdown, getTopDivisi, getTrenBulanan } from "@/services/dashboardService";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportDialog } from "./import-dialog";
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
          <ImportDialog />
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/api/export">Export Excel</a>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Ajuan" value={kpi.totalAjuan} icon={FileStack} tone="primary" />
        <KpiCard
          label="Total Nominal"
          value={formatRupiah(kpi.totalNominal)}
          icon={Wallet}
          tone="info"
        />
        <KpiCard
          label="Selesai Dibayar"
          value={kpi.totalSelesaiDibayar}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Menunggu Approval"
          value={kpi.totalMenungguApproval}
          icon={Clock}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {statusBreakdown.map((row) => (
              <div key={row.status} className="flex items-center justify-between">
                <StatusBadge status={row.status} />
                <span className="text-muted-foreground">
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
          <CardContent className="space-y-3 text-sm">
            {topDivisi.map((row) => (
              <div key={row.nama} className="flex items-center justify-between">
                <span className="font-medium">{row.nama}</span>
                <span className="text-muted-foreground">
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
          <CardContent className="space-y-3 text-sm">
            {tren.map((row) => (
              <div key={row.bulan} className="flex items-center justify-between">
                <span className="font-medium">{row.bulan}</span>
                <span className="text-muted-foreground">
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
          {ajuanList.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Belum ada ajuan"
              description="Ajuan yang dibuat oleh divisi akan muncul di sini."
            />
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
