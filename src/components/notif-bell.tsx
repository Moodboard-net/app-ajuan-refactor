"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { getNotifCount } from "@/services/notifikasiService";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 30_000;

export function NotifBell({ href }: { href: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let prevCount: number | null = null;
    let cancelled = false;

    async function poll() {
      const next = await getNotifCount();
      if (cancelled) return;

      if (prevCount !== null && next > prevCount) {
        toast.info(`${next - prevCount} ajuan baru masuk`);
      }
      prevCount = next;
      setCount(next);
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      nativeButton={false}
      render={
        <Link href={href} className="relative">
          <Bell />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Link>
      }
    />
  );
}
