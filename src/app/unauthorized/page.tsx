import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" />
      </div>
      <h1 className="text-2xl font-semibold">Akses Ditolak</h1>
      <p className="text-muted-foreground">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button
        className="mt-2"
        nativeButton={false}
        render={<Link href="/">Kembali ke Beranda</Link>}
      />
    </div>
  );
}
