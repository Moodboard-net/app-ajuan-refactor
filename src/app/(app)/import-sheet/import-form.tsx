"use client";

import { useActionState } from "react";
import { FileSpreadsheet, TriangleAlert, CheckCircle2 } from "lucide-react";
import { importSheetAction, type ImportState } from "@/server/actions/import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ImportState = {};

export function ImportForm() {
  const [state, formAction, pending] = useActionState(
    importSheetAction,
    initialState
  );

  return (
    <Card className="max-w-md">
      <CardContent>
        <form action={formAction} className="space-y-4">
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
          {state?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="flex items-start gap-1.5 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                Berhasil impor {state.imported} baris.
                {state.skipped && state.skipped.length > 0 &&
                  ` Dilewati: ${state.skipped.join(", ")}`}
              </span>
            </p>
          )}
          <Button type="submit" disabled={pending}>
            <FileSpreadsheet />
            {pending ? "Mengimpor..." : "Impor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
