"use client";

import { useActionState, useState } from "react";
import { KeyRound, TriangleAlert } from "lucide-react";
import { changePasswordAction } from "@/services/profileService";
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

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <KeyRound />
            Ganti Password
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti Password</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordLama">Password Lama</Label>
            <Input id="passwordLama" name="passwordLama" type="password" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordBaru">Password Baru</Label>
            <Input id="passwordBaru" name="passwordBaru" type="password" required />
          </div>
          {state?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="text-sm text-success">Password berhasil diganti.</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
