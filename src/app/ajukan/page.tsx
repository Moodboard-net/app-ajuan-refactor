import { listDivisiOptions } from "@/services/ajuanService";
import { AjukanForm } from "./ajukan-form";

export const dynamic = "force-dynamic";

export default async function AjukanPage() {
  const divisiOptions = await listDivisiOptions();

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <AjukanForm divisiOptions={divisiOptions} />
    </div>
  );
}
