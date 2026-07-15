import { requireRole } from "@/lib/auth";
import { ImportForm } from "./import-form";

export default async function ImportSheetPage() {
  await requireRole("admin");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import Data Ajuan (Excel)</h1>
      <ImportForm />
    </div>
  );
}
