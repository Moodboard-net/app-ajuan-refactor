import { requireUser } from "@/server/auth";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  dirkeu: "Dirkeu",
  divisi: "Divisi",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Ajuan Pembayaran</span>
          <Badge variant="secondary">{roleLabel[session.role]}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.namaLengkap ?? session.username}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
