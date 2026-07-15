"use client";

import { useActionState } from "react";
import { uploadBuktiAction, type ActionState } from "@/lib/actions/ajuan";
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
    return <p className="text-sm text-muted-foreground">Bukti transfer sudah diunggah.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="idAjuan" value={idAjuan} />
      <div className="space-y-2">
        <Label htmlFor="bukti-file">File Bukti Transfer</Label>
        <Input id="bukti-file" name="file" type="file" required accept="image/*,.pdf" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Mengunggah..." : "Unggah Bukti Transfer"}
      </Button>
    </form>
  );
}
