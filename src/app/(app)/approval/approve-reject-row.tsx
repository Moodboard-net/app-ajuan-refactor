"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";
import { approveAjuanAction, rejectAjuanAction } from "@/services/ajuanService";
import type { ActionState } from "@/types";
import { Button } from "@/components/ui/button";
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
          <Check />
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

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <X />
            Tolak
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak Ajuan</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="idAjuan" value={idAjuan} />
          <Textarea name="catatan" placeholder="Alasan penolakan" required />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Memproses..." : "Kirim Penolakan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
