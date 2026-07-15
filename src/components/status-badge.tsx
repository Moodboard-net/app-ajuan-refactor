import { Badge } from "@/components/ui/badge";

const variantByStatus: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Menunggu Approval": "outline",
  Disetujui: "secondary",
  Ditolak: "destructive",
  "Selesai Dibayar": "default",
  Surplus: "secondary",
  Defisit: "destructive",
  Sesuai: "default",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variantByStatus[status] ?? "outline"}>{status}</Badge>;
}
