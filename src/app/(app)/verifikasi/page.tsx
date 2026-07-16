import { ClipboardList, FileCheck2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  listAjuanMenungguVerifikasi,
  listAjuanSelesaiTanpaLpj,
  listDivisiOptions,
} from "@/services/ajuanService";
import { markNotifSeen } from "@/services/notifikasiService";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
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
import { CreateAjuanDialog, KoreksiAjuanDialog } from "./verifikasi-form-dialog";
import { UploadLpjAdminDialog } from "./upload-lpj-admin-dialog";

export default async function VerifikasiPage() {
  await requireRole("super_admin");
  await markNotifSeen();

  const [antrian, selesaiTanpaLpj, divisiOptions] = await Promise.all([
    listAjuanMenungguVerifikasi(),
    listAjuanSelesaiTanpaLpj(),
    listDivisiOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Verifikasi Ajuan</h1>
        <CreateAjuanDialog divisiOptions={divisiOptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perlu Verifikasi / Revisi / Ditolak</CardTitle>
        </CardHeader>
        <CardContent>
          {antrian.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Tidak ada ajuan yang perlu diverifikasi"
              description="Ajuan baru dari form publik akan muncul di sini untuk dicocokkan dengan berkas fisik."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {antrian.map((ajuan) => (
                  <TableRow key={ajuan.id}>
                    <TableCell>{formatDate(ajuan.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {ajuan.kode_tracking ?? "-"}
                    </TableCell>
                    <TableCell>{ajuan.nama_divisi}</TableCell>
                    <TableCell>{ajuan.nama_pengaju}</TableCell>
                    <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
                    <TableCell>
                      <StatusBadge status={ajuan.status} />
                    </TableCell>
                    <TableCell>
                      <KoreksiAjuanDialog ajuan={ajuan} divisiOptions={divisiOptions} />
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
          <CardTitle className="text-base">Upload LPJ Cadangan</CardTitle>
        </CardHeader>
        <CardContent>
          {selesaiTanpaLpj.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="Tidak ada ajuan yang menunggu LPJ"
              description="Semua ajuan Selesai Dibayar sudah memiliki LPJ, atau belum ada yang selesai dibayar."
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
                {selesaiTanpaLpj.map((ajuan) => (
                  <TableRow key={ajuan.id}>
                    <TableCell>{formatDate(ajuan.created_at)}</TableCell>
                    <TableCell>{ajuan.nama_divisi}</TableCell>
                    <TableCell>{ajuan.nama_pengaju}</TableCell>
                    <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
                    <TableCell>
                      <UploadLpjAdminDialog idAjuan={ajuan.id} />
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
