"use client";

import { useActionState } from "react";
import { CheckCircle2, Upload, TriangleAlert } from "lucide-react";
import { uploadBuktiAction } from "@/services/ajuanService";
import type { ActionState } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function UploadBuktiForm({ idAjuan }: { idAjuan: number }) {
  const [state, formAction, pending] = useActionState(
    uploadBuktiAction,
    initialState
  );

  if (state?.success) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-success">
        <CheckCircle2 className="size-4" />
        Bukti transfer sudah diunggah.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="idAjuan" value={idAjuan} />
      <div className="space-y-2">
        <Label htmlFor="bukti-file">File Bukti Transfer</Label>
        <Input id="bukti-file" name="file" type="file" required accept="image/*,.pdf" />
      </div>
      {state?.error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" />
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        <Upload />
        {pending ? "Mengunggah..." : "Unggah Bukti Transfer"}
      </Button>
    </form>
  );
}
