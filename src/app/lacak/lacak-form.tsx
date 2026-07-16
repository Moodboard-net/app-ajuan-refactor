"use client";

import { useActionState } from "react";
import { Search, TriangleAlert, Upload } from "lucide-react";
import {
  lookupAjuanByTrackingAction,
  uploadLpjPublicAction,
  type LacakState,
} from "@/services/ajuanService";
import type { ActionState } from "@/types";
import { formatRupiah, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialLacakState: LacakState = {};
const initialLpjState: ActionState = {};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

function UploadLpjSection({ idAjuan, kodeTracking }: { idAjuan: number; kodeTracking: string }) {
  const [state, formAction, pending] = useActionState(
    uploadLpjPublicAction,
    initialLpjState
  );

  if (state?.success) {
    return (
      <p className="rounded-md bg-success/15 px-3 py-2 text-sm text-success">
        LPJ berhasil diunggah. Terima kasih.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Upload LPJ</p>
      <input type="hidden" name="idAjuan" value={idAjuan} />
      <input type="hidden" name="kodeTracking" value={kodeTracking} />
      <div className="space-y-2">
        <Label htmlFor="nominalRealisasi">Nominal Realisasi (Rp)</Label>
        <Input
          id="nominalRealisasi"
          name="nominalRealisasi"
          type="number"
          min="0"
          step="1"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lpj-file">File LPJ</Label>
        <Input id="lpj-file" name="file" type="file" required accept="image/*,.pdf" />
      </div>
      {state?.error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" />
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        <Upload />
        {pending ? "Mengunggah..." : "Unggah LPJ"}
      </Button>
    </form>
  );
}

export function LacakForm() {
  const [state, formAction, pending] = useActionState(
    lookupAjuanByTrackingAction,
    initialLacakState
  );
  const kodeTracking = state?.ajuan?.kode_tracking ?? "";

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">Cek Status Ajuan</CardTitle>
        <CardDescription>Masukkan kode tracking yang Anda terima saat mengirim ajuan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="flex gap-2">
          <Input
            name="kodeTracking"
            placeholder="Contoh: AB12CD34"
            className="font-mono uppercase"
            required
            autoFocus
          />
          <Button type="submit" disabled={pending}>
            <Search />
            {pending ? "Mencari..." : "Cari"}
          </Button>
        </form>

        {state?.error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {state.error}
          </p>
        )}

        {state?.ajuan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={state.ajuan.status} />
            </div>
            <div className="text-sm">
              <DetailRow label="Tanggal" value={formatDate(state.ajuan.created_at)} />
              <DetailRow label="Divisi" value={state.ajuan.nama_divisi} />
              <DetailRow label="Pengaju" value={state.ajuan.nama_pengaju} />
              <DetailRow
                label="Nominal"
                value={formatRupiah(state.ajuan.nominal_diajukan)}
              />
              {state.ajuan.catatan_approval && (
                <DetailRow label="Catatan" value={state.ajuan.catatan_approval} />
              )}
            </div>

            {state.ajuan.status === "Selesai Dibayar" && !state.sudahAdaLpj && (
              <UploadLpjSection idAjuan={state.ajuan.id} kodeTracking={kodeTracking} />
            )}
            {state.ajuan.status === "Selesai Dibayar" && state.sudahAdaLpj && (
              <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                LPJ sudah diunggah untuk ajuan ini.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
