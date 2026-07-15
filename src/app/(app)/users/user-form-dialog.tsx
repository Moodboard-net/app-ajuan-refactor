"use client";

import { useActionState, useState } from "react";
import { UserPlus, Pencil, TriangleAlert } from "lucide-react";
import { createUserAction, updateUserAction } from "@/services/userService";
import type { ActionState } from "@/types";
import type { User } from "@/models/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionState = {};

const roleLabel: Record<string, string> = {
  admin: "Admin",
  dirkeu: "Dirkeu",
  divisi: "Divisi",
};

export function UserFormDialog({
  user,
  divisiOptions,
}: {
  user?: User;
  divisiOptions: { id: number; nama: string }[];
}) {
  const isEdit = Boolean(user);
  const action = isEdit ? updateUserAction : createUserAction;
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user?.role ?? "divisi");
  const [state, formAction, pending] = useActionState(action, initialState);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm">
              <Pencil />
              Edit
            </Button>
          ) : (
            <Button>
              <UserPlus />
              Tambah User
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Tambah User"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={user!.id} />}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={user?.username}
              readOnly={isEdit}
              className={isEdit ? "bg-muted text-muted-foreground" : undefined}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="namaLengkap">Nama Lengkap</Label>
            <Input
              id="namaLengkap"
              name="namaLengkap"
              defaultValue={user?.nama_lengkap ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              value={role}
              onValueChange={(value) => {
                if (value) setRole(value);
              }}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Pilih role">
                  {(value: string) => roleLabel[value] ?? "Pilih role"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === "divisi" && (
            <div className="space-y-2">
              <Label htmlFor="idDivisi">Divisi</Label>
              <Select
                name="idDivisi"
                defaultValue={user?.id_divisi ? String(user.id_divisi) : undefined}
              >
                <SelectTrigger id="idDivisi" className="w-full">
                  <SelectValue placeholder="Pilih divisi">
                    {(value: string | null) =>
                      divisiOptions.find((d) => String(d.id) === value)?.nama ??
                      "Pilih divisi"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {divisiOptions.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEdit ? "Password Baru (opsional)" : "Password"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={isEdit ? "Kosongkan jika tidak diganti" : undefined}
              required={!isEdit}
            />
          </div>

          {state?.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {state.error}
            </p>
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
