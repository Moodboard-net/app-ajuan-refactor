"use client";

import { useActionState, useState } from "react";
import {
  approveAjuanAction,
  rejectAjuanAction,
  type ActionState,
} from "@/server/actions/ajuan";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function ApproveButton({
  idAjuan,
  blocked,
}: {
  idAjuan: number;
  blocked: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    approveAjuanAction,
    initialState
  );

  return (
    <div className="space-y-1">
      <form action={formAction}>
        <input type="hidden" name="idAjuan" value={idAjuan} />
        <Button type="submit" size="sm" disabled={pending || blocked}>
          {pending ? "Memproses..." : "Setujui"}
        </Button>
      </form>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

export function RejectButton({ idAjuan }: { idAjuan: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    rejectAjuanAction,
    initialState
  );

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Tolak
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="idAjuan" value={idAjuan} />
      <Textarea
        name="catatan"
        placeholder="Alasan penolakan"
        required
        className="w-64"
      />
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? "Memproses..." : "Kirim Penolakan"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
