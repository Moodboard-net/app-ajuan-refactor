import { requireRole } from "@/server/auth";
import { listAjuanMenungguApproval, findAjuanBelumLpj } from "@/server/ajuan";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApproveButton, RejectButton } from "./approve-reject-row";

export default async function ApprovalPage() {
  await requireRole("dirkeu");
  const data = await listAjuanMenungguApproval();

  const rows = await Promise.all(
    data.map(async (ajuan) => ({
      ajuan,
      belumLpj: await findAjuanBelumLpj(ajuan.id_divisi, ajuan.id),
    }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Approval Ajuan</h1>

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
          {rows.map(({ ajuan, belumLpj }) => (
            <TableRow key={ajuan.id}>
              <TableCell>{formatDate(ajuan.created_at)}</TableCell>
              <TableCell>{ajuan.nama_divisi}</TableCell>
              <TableCell>{ajuan.nama_pengaju}</TableCell>
              <TableCell>{formatRupiah(ajuan.nominal_diajukan)}</TableCell>
              <TableCell>
                {belumLpj.length > 0 ? (
                  <Badge variant="destructive">
                    LPJ ajuan sebelumnya belum lengkap ({belumLpj.length})
                  </Badge>
                ) : (
                  <Badge variant="secondary">Lengkap</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <ApproveButton idAjuan={ajuan.id} blocked={belumLpj.length > 0} />
                  <RejectButton idAjuan={ajuan.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Tidak ada ajuan menunggu approval.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
