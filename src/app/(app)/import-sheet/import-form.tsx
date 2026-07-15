"use client";

import { useActionState } from "react";
import { importSheetAction, type ImportState } from "@/lib/actions/import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ImportState = {};

export function ImportForm() {
  const [state, formAction, pending] = useActionState(
    importSheetAction,
    initialState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="import-file">File Excel (.xlsx)</Label>
        <Input
          id="import-file"
          name="file"
          type="file"
          accept=".xlsx"
          required
        />
        <p className="text-xs text-muted-foreground">
          Kolom: Divisi, Nama Pengaju, Atas Nama Rekening, Nomor Rekening,
          Bank, Keterangan Kegiatan, Nominal Diajukan.
        </p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-muted-foreground">
          Berhasil impor {state.imported} baris.
          {state.skipped && state.skipped.length > 0 &&
            ` Dilewati: ${state.skipped.join(", ")}`}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Mengimpor..." : "Impor"}
      </Button>
    </form>
  );
}
