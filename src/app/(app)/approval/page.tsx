import { ClipboardCheck, TriangleAlert, CheckCircle2, FileStack, Wallet, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  listAjuanMenungguApproval,
  listAjuanSiapBayar,
  countAjuanBelumLpj,
} from "@/services/ajuanService";
import { getKpi, getStatusBreakdown } from "@/services/dashboardService";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApproveButton, RejectButton, ReviseButton } from "./approval-actions";
import { UploadBuktiDialog } from "./upload-bukti-dialog";

export default async function ApprovalPage() {
  await requireRole("approval");

  const [kpi, statusBreakdown, antrian, siapBayar] = await Promise.all([
    getKpi(),
    getStatusBreakdown(),
    listAjuanMenungguApproval(),
    listAjuanSiapBayar(),
  ]);

  const rows = await Promise.all(
    antrian.map(async (ajuan) => ({
      ajuan,
      belumLpjCount: await countAjuanBelumLpj(ajuan.id_divisi, ajuan.id),
    }))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard Approval</h1>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
          <CardTitle className="text-base">Antrian Approval</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Tidak ada ajuan menunggu approval"
              description="Ajuan yang sudah lolos verifikasi Super Admin akan muncul di sini."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status LPJ</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ ajuan, belumLpjCount }) => (
                  <TableRow key={ajuan.id}>
                    <TableCell>{formatDate(ajuan.created_at)}</TableCell>
                    <TableCell>{ajuan.nama_divisi}</TableCell>
                    <TableCell>{ajuan.nama_pengaju}</TableCell>
                    <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
                    <TableCell>
                      {belumLpjCount > 0 ? (
                        <Badge className="border-transparent bg-warning/15 text-warning">
                          <TriangleAlert />
                          LPJ belum lengkap ({belumLpjCount})
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-success/15 text-success">
                          <CheckCircle2 />
                          Lengkap
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <ApproveButton idAjuan={ajuan.id} blocked={belumLpjCount > 0} />
                        <ReviseButton idAjuan={ajuan.id} />
                        <RejectButton idAjuan={ajuan.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disetujui &mdash; Menunggu Bukti Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          {siapBayar.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Tidak ada ajuan yang menunggu transfer"
              description="Ajuan yang sudah disetujui akan muncul di sini sampai bukti transfer diunggah."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {siapBayar.map((ajuan) => (
                  <TableRow key={ajuan.id}>
                    <TableCell>{formatDate(ajuan.created_at)}</TableCell>
                    <TableCell>{ajuan.nama_divisi}</TableCell>
                    <TableCell>{ajuan.nama_pengaju}</TableCell>
                    <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
                    <TableCell>
                      <UploadBuktiDialog idAjuan={ajuan.id} />
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
