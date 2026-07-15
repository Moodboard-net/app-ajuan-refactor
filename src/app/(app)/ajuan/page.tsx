import Link from "next/link";
import { FileStack } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listAjuanByDivisi } from "@/services/ajuanService";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AjuanFormDialog } from "./ajuan-form-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AjuanListPage() {
  const session = await requireRole("divisi");
  const data = await listAjuanByDivisi(session.idDivisi!);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ajuan Divisi {session.namaLengkap}</h1>
        <AjuanFormDialog />
      </div>

      <Card>
        <CardContent>
          {data.length === 0 ? (
            <EmptyState
              icon={FileStack}
              title="Belum ada ajuan"
              description="Klik 'Ajuan Baru' untuk membuat pengajuan pembayaran pertama."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead>Kegiatan</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((ajuan) => (
                  <TableRow key={ajuan.id}>
                    <TableCell>{formatDate(ajuan.created_at)}</TableCell>
                    <TableCell>{ajuan.nama_pengaju}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ajuan.keterangan_kegiatan}
                    </TableCell>
                    <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
                    <TableCell>
                      <StatusBadge status={ajuan.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/ajuan/${ajuan.id}`}>Detail</Link>}
                      />
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
