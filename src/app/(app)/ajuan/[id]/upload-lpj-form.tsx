"use client";

import { useActionState } from "react";
import { uploadLpjAction, type ActionState } from "@/lib/actions/ajuan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function UploadLpjForm({ idAjuan }: { idAjuan: number }) {
  const [state, formAction, pending] = useActionState(
    uploadLpjAction,
    initialState
  );

  if (state?.success) {
    return <p className="text-sm text-muted-foreground">LPJ sudah diunggah.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="idAjuan" value={idAjuan} />
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
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Mengunggah..." : "Unggah LPJ"}
      </Button>
    </form>
  );
}
