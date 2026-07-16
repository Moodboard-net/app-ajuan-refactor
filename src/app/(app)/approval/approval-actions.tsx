"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw } from "lucide-react";
import {
  approveAjuanAction,
  rejectAjuanAction,
  reviseAjuanAction,
} from "@/services/ajuanService";
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
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    approveAjuanAction,
    initialState
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

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

function CatatanDialog({
  idAjuan,
  action,
  label,
  title,
  icon: Icon,
  variant,
}: {
  idAjuan: number;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  title: string;
  icon: React.ElementType;
  variant: "outline" | "destructive";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

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
          <Button variant={variant} size="sm">
            <Icon />
            {label}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="idAjuan" value={idAjuan} />
          <Textarea name="catatan" placeholder="Catatan (wajib diisi)" required />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" variant={variant} disabled={pending}>
              {pending ? "Memproses..." : "Kirim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RejectButton({ idAjuan }: { idAjuan: number }) {
  return (
    <CatatanDialog
      idAjuan={idAjuan}
      action={rejectAjuanAction}
      label="Tolak"
      title="Tolak Ajuan"
      icon={X}
      variant="destructive"
    />
  );
}

export function ReviseButton({ idAjuan }: { idAjuan: number }) {
  return (
    <CatatanDialog
      idAjuan={idAjuan}
      action={reviseAjuanAction}
      label="Minta Revisi"
      title="Minta Revisi Ajuan"
      icon={RotateCcw}
      variant="outline"
    />
  );
}
