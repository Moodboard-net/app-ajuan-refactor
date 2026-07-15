import { ClipboardCheck, TriangleAlert, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listAjuanMenungguApproval, countAjuanBelumLpj } from "@/services/ajuanService";
import { formatRupiah, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
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
      belumLpjCount: await countAjuanBelumLpj(ajuan.id_divisi, ajuan.id),
    }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Approval Ajuan</h1>

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Tidak ada ajuan menunggu approval"
              description="Semua ajuan sudah diproses. Ajuan baru dari divisi akan muncul di sini."
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
                      <div className="flex gap-2">
                        <ApproveButton idAjuan={ajuan.id} blocked={belumLpjCount > 0} />
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
    </div>
  );
}
