"use client";

import { useActionState, useState } from "react";
import { KeyRound, TriangleAlert, ArrowLeft } from "lucide-react";
import {
  verifyPasswordLamaAction,
  changePasswordAction,
} from "@/services/profileService";
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

/**
 * Instance baru dibuat setiap dialog dibuka (lihat `{open && <PasswordWizard />}`
 * di bawah) supaya seluruh state hook-nya (step, password lama, hasil aksi
 * sebelumnya) selalu bersih tanpa perlu reset manual yang gampang meleset.
 */
function PasswordWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [passwordLama, setPasswordLama] = useState("");

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyPasswordLamaAction,
    initialState
  );
  const [changeState, changeAction, changePending] = useActionState(
    changePasswordAction,
    initialState
  );

  const [handledVerifyState, setHandledVerifyState] = useState(verifyState);
  if (verifyState !== handledVerifyState) {
    setHandledVerifyState(verifyState);
    if (verifyState?.success) setStep(2);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ganti Password ({step}/2)</DialogTitle>
      </DialogHeader>

      {step === 1 ? (
        <form
          action={(formData) => {
            setPasswordLama(String(formData.get("passwordLama") ?? ""));
            verifyAction(formData);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="passwordLama">Password Lama</Label>
            <Input
              id="passwordLama"
              name="passwordLama"
              type="password"
              required
              autoFocus
            />
          </div>
          {verifyState?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {verifyState.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={verifyPending}>
              {verifyPending ? "Memeriksa..." : "Lanjut"}
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <form action={changeAction} className="space-y-4">
          <input type="hidden" name="passwordLama" value={passwordLama} />
          <div className="space-y-2">
            <Label htmlFor="passwordBaru">Password Baru</Label>
            <Input
              id="passwordBaru"
              name="passwordBaru"
              type="password"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="konfirmasiPasswordBaru">Konfirmasi Password Baru</Label>
            <Input
              id="konfirmasiPasswordBaru"
              name="konfirmasiPasswordBaru"
              type="password"
              required
            />
          </div>
          {changeState?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {changeState.error}
            </p>
          )}
          {changeState?.success && (
            <p className="text-sm text-success">Password berhasil diganti.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft />
              Kembali
            </Button>
            <Button type="submit" disabled={changePending}>
              {changePending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);

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
      <DialogContent>{open && <PasswordWizard />}</DialogContent>
    </Dialog>
  );
}
