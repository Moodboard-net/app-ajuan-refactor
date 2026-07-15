import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth";
import { getAjuanById } from "@/server/ajuan";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadBuktiForm } from "./upload-bukti-form";
import { UploadLpjForm } from "./upload-lpj-form";

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
        <StatusBadge status={ajuan.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Ajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Tanggal: {formatDate(ajuan.created_at)}</p>
          <p>Nama Pengaju: {ajuan.nama_pengaju}</p>
          <p>Atas Nama Rekening: {ajuan.atas_nama_rekening}</p>
          <p>Nomor Rekening: {ajuan.nomor_rekening} ({ajuan.nama_bank})</p>
          <p>Keterangan Kegiatan: {ajuan.keterangan_kegiatan}</p>
          <p>Nominal Diajukan: {formatRupiah(ajuan.nominal_diajukan)}</p>
          {ajuan.catatan_approval && (
            <p>Catatan Dirkeu: {ajuan.catatan_approval}</p>
          )}
        </CardContent>
      </Card>

      {ajuan.status === "Disetujui" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Bukti Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadBuktiForm idAjuan={ajuan.id} />
          </CardContent>
        </Card>
      )}

      {ajuan.status === "Selesai Dibayar" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload LPJ</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadLpjForm idAjuan={ajuan.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
