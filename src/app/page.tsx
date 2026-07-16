import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, FileEdit, Search, LogIn } from "lucide-react";
import { getSession } from "@/lib/auth";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const roleHome: Record<Role, string> = {
  super_admin: "/cek-ajuan",
  approval: "/approval",
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect(roleHome[session.role]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Ajuan Pembayaran</h1>
        <p className="max-w-md text-muted-foreground">
          Sistem pencatatan ajuan pembayaran untuk bagian Keuangan. Divisi tidak perlu akun untuk
          mengajukan pembayaran.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="items-center text-center">
            <FileEdit className="size-6 text-primary" />
            <CardTitle className="text-base">Ajukan Pembayaran</CardTitle>
            <CardDescription>Isi form ajuan tanpa perlu login</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" nativeButton={false} render={<Link href="/ajukan">Mulai Ajukan</Link>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-center text-center">
            <Search className="size-6 text-primary" />
            <CardTitle className="text-base">Cek Status</CardTitle>
            <CardDescription>Pantau ajuan dengan kode tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              nativeButton={false}
              render={<Link href="/lacak">Cek Status</Link>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-center text-center">
            <LogIn className="size-6 text-primary" />
            <CardTitle className="text-base">Login Staf</CardTitle>
            <CardDescription>Untuk Super Admin & Approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login">Masuk</Link>}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
