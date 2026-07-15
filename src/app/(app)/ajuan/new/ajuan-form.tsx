"use client";

import { useActionState } from "react";
import { Send, TriangleAlert } from "lucide-react";
import { createAjuanAction, type ActionState } from "@/server/actions/ajuan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

export function AjuanForm() {
  const [state, formAction, pending] = useActionState(
    createAjuanAction,
    initialState
  );

  return (
    <Card className="max-w-lg">
      <CardContent>
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
          <Button type="submit" disabled={pending}>
            <Send />
            {pending ? "Menyimpan..." : "Ajukan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
