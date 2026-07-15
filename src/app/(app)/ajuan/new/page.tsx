import { requireRole } from "@/lib/auth";
import { AjuanForm } from "./ajuan-form";

export default async function NewAjuanPage() {
  await requireRole("divisi");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ajuan Pembayaran Baru</h1>
      <AjuanForm />
    </div>
  );
}
