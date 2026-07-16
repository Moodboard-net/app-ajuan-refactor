"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, TriangleAlert } from "lucide-react";
import { uploadLpjAdminAction } from "@/services/ajuanService";
import type { ActionState } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionState = {};

/** Jalur cadangan: dipakai Super Admin bila pengaju kehilangan kode tracking untuk /lacak. */
export function UploadLpjAdminDialog({ idAjuan }: { idAjuan: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    uploadLpjAdminAction,
    initialState
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
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Upload />
            Upload LPJ
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload LPJ (Cadangan) #{idAjuan}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="idAjuan" value={idAjuan} />
          <div className="space-y-2">
            <Label htmlFor={`nominalRealisasi-${idAjuan}`}>Nominal Realisasi (Rp)</Label>
            <Input
              id={`nominalRealisasi-${idAjuan}`}
              name="nominalRealisasi"
              type="number"
              min="0"
              step="1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`lpj-file-${idAjuan}`}>File LPJ</Label>
            <Input
              id={`lpj-file-${idAjuan}`}
              name="file"
              type="file"
              required
              accept="image/*,.pdf"
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
              <Upload />
              {pending ? "Mengunggah..." : "Unggah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
