"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Send, TriangleAlert, Copy, Search } from "lucide-react";
import {
  createAjuanPublicAction,
  type PublicAjuanState,
} from "@/services/ajuanService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: PublicAjuanState = {};

export function AjukanForm({
  divisiOptions,
}: {
  divisiOptions: { id: number; nama: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createAjuanPublicAction,
    initialState
  );

  if (state?.success && state.trackingCode) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl">Ajuan Berhasil Dikirim</CardTitle>
          <CardDescription>
            Simpan kode tracking berikut untuk memantau status ajuan Anda di halaman{" "}
            <Link href="/lacak" className="underline">
              Cek Status
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border bg-muted px-4 py-3 font-mono text-lg font-semibold tracking-widest">
            {state.trackingCode}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigator.clipboard.writeText(state.trackingCode!)}
            >
              <Copy />
            </Button>
          </div>
          <Button
            className="mt-4 w-full"
            nativeButton={false}
            render={
              <Link href="/lacak">
                <Search />
                Cek Status Ajuan
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">Form Ajuan Pembayaran</CardTitle>
        <CardDescription>
          Isi data berikut, ajuan akan diverifikasi oleh Keuangan setelah kertas fisik diterima.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idDivisi">Divisi</Label>
            <Select name="idDivisi">
              <SelectTrigger id="idDivisi" className="w-full">
                <SelectValue placeholder="Pilih divisi" />
              </SelectTrigger>
              <SelectContent>
                {divisiOptions.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="namaPengaju">Nama Pengaju</Label>
            <Input id="namaPengaju" name="namaPengaju" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="atasNamaRekening">Atas Nama Rekening</Label>
            <Input id="atasNamaRekening" name="atasNamaRekening" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomorRekening">Nomor Rekening</Label>
              <Input id="nomorRekening" name="nomorRekening" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaBank">Nama Bank</Label>
              <Input id="namaBank" name="namaBank" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keteranganKegiatan">Keterangan Kegiatan</Label>
            <Textarea id="keteranganKegiatan" name="keteranganKegiatan" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nominalDiajukan">Nominal Diajukan (Rp)</Label>
            <Input
              id="nominalDiajukan"
              name="nominalDiajukan"
              type="number"
              min="1"
              step="1"
              required
            />
          </div>
          {state?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            <Send />
            {pending ? "Mengirim..." : "Kirim Ajuan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
