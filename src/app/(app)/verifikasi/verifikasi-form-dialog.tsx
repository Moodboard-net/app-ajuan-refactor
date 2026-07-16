"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, TriangleAlert, Copy } from "lucide-react";
import {
  createAjuanPublicAction,
  submitToApprovalAction,
  type PublicAjuanState,
} from "@/services/ajuanService";
import type { Ajuan } from "@/models/ajuan";
import type { ActionState } from "@/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialCreateState: PublicAjuanState = {};
const initialEditState: ActionState = {};

function AjuanFields({
  divisiOptions,
  ajuan,
}: {
  divisiOptions: { id: number; nama: string }[];
  ajuan?: Ajuan;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="idDivisi">Divisi</Label>
        <Select name="idDivisi" defaultValue={ajuan ? String(ajuan.id_divisi) : undefined}>
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
        <Input id="namaPengaju" name="namaPengaju" defaultValue={ajuan?.nama_pengaju} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="atasNamaRekening">Atas Nama Rekening</Label>
        <Input
          id="atasNamaRekening"
          name="atasNamaRekening"
          defaultValue={ajuan?.atas_nama_rekening}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nomorRekening">Nomor Rekening</Label>
          <Input
            id="nomorRekening"
            name="nomorRekening"
            defaultValue={ajuan?.nomor_rekening}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="namaBank">Nama Bank</Label>
          <Input id="namaBank" name="namaBank" defaultValue={ajuan?.nama_bank} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="keteranganKegiatan">Keterangan Kegiatan</Label>
        <Textarea
          id="keteranganKegiatan"
          name="keteranganKegiatan"
          defaultValue={ajuan?.keterangan_kegiatan}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nominalDiajukan">Nominal Diajukan (Rp)</Label>
        <Input
          id="nominalDiajukan"
          name="nominalDiajukan"
          type="number"
          min="1"
          step="1"
          defaultValue={ajuan?.nominal_diajukan}
          required
        />
      </div>
    </>
  );
}

/** Super Admin: mencatat ajuan yang masuk lewat kertas fisik langsung dari halaman internal. */
export function CreateAjuanDialog({
  divisiOptions,
}: {
  divisiOptions: { id: number; nama: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createAjuanPublicAction,
    initialCreateState
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Buat Ajuan Baru
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Ajuan Baru</DialogTitle>
        </DialogHeader>
        {state?.success && state.trackingCode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ajuan berhasil dicatat. Simpan kode tracking berikut untuk pengaju:
            </p>
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
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <AjuanFields divisiOptions={divisiOptions} />
            {state?.error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                {state.error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                <Send />
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Super Admin: cocokkan/koreksi data hasil verifikasi lalu teruskan ke Approval. */
export function KoreksiAjuanDialog({
  ajuan,
  divisiOptions,
}: {
  ajuan: Ajuan;
  divisiOptions: { id: number; nama: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitToApprovalAction,
    initialEditState
  );

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Koreksi &amp; Ajukan</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koreksi Ajuan #{ajuan.id}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={ajuan.id} />
          <AjuanFields divisiOptions={divisiOptions} ajuan={ajuan} />
          {ajuan.catatan_approval && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Catatan Approval sebelumnya: {ajuan.catatan_approval}
            </p>
          )}
          {state?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <Send />
              {pending ? "Mengirim..." : "Ajukan ke Approval"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
