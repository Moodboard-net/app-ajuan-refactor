import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listAjuanByDivisi } from "@/lib/ajuan";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
        <Button
          nativeButton={false}
          render={<Link href="/ajuan/new">Ajuan Baru</Link>}
        />
      </div>

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
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada ajuan.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
