import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAjuanById } from "@/services/ajuanService";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadBuktiDialog } from "./upload-bukti-dialog";
import { UploadLpjDialog } from "./upload-lpj-dialog";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default async function AjuanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("divisi");
  const { id } = await params;
  const ajuan = await getAjuanById(Number(id));

  if (!ajuan || ajuan.id_divisi !== session.idDivisi) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ajuan #{ajuan.id}</h1>
        <div className="flex items-center gap-2">
          {ajuan.status === "Disetujui" && <UploadBuktiDialog idAjuan={ajuan.id} />}
          {ajuan.status === "Selesai Dibayar" && <UploadLpjDialog idAjuan={ajuan.id} />}
          <StatusBadge status={ajuan.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" />
            Detail Ajuan
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <DetailRow label="Tanggal" value={formatDate(ajuan.created_at)} />
          <DetailRow label="Nama Pengaju" value={ajuan.nama_pengaju} />
          <DetailRow label="Atas Nama Rekening" value={ajuan.atas_nama_rekening} />
          <DetailRow
            label="Nomor Rekening"
            value={`${ajuan.nomor_rekening} (${ajuan.nama_bank})`}
          />
          <DetailRow label="Keterangan Kegiatan" value={ajuan.keterangan_kegiatan} />
          <DetailRow label="Nominal Diajukan" value={formatRupiah(ajuan.nominal_diajukan)} />
          {ajuan.catatan_approval && (
            <DetailRow label="Catatan Dirkeu" value={ajuan.catatan_approval} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
