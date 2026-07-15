import {
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Equal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { className: string; icon: React.ElementType }> = {
  "Menunggu Approval": {
    className: "bg-warning/15 text-warning border-transparent",
    icon: Clock,
  },
  Disetujui: {
    className: "bg-info/15 text-info border-transparent",
    icon: CheckCircle2,
  },
  Ditolak: {
    className: "bg-destructive/10 text-destructive border-transparent",
    icon: XCircle,
  },
  "Selesai Dibayar": {
    className: "bg-success/15 text-success border-transparent",
    icon: Wallet,
  },
  Surplus: {
    className: "bg-success/15 text-success border-transparent",
    icon: TrendingUp,
  },
  Defisit: {
    className: "bg-destructive/10 text-destructive border-transparent",
    icon: TrendingDown,
  },
  Sesuai: {
    className: "bg-info/15 text-info border-transparent",
    icon: Equal,
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status];
  const Icon = config?.icon;

  return (
    <Badge className={cn("font-medium", config?.className)}>
      {Icon && <Icon />}
      {status}
    </Badge>
  );
}
