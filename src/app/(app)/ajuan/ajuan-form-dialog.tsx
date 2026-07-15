"use client";

import { useActionState, useState } from "react";
import { Plus, Send, TriangleAlert } from "lucide-react";
import { createAjuanAction } from "@/services/ajuanService";
import type { ActionState } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionState = {};

export function AjuanFormDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createAjuanAction,
    initialState
  );

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Ajuan Baru
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuan Pembayaran Baru</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="namaPengaju">Nama Pengaju</Label>
            <Input id="namaPengaju" name="namaPengaju" required />
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
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <Send />
              {pending ? "Menyimpan..." : "Ajukan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
