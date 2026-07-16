import Link from "next/link";
import { Wallet, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCurrentUser, getPhotoUrl } from "@/services/profileService";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { NotifBell } from "@/components/notif-bell";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  approval: "Approval",
};

const notifHref: Record<string, string> = {
  super_admin: "/verifikasi",
  approval: "/approval",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const displayName = session.namaLengkap ?? session.username;
  const currentUser = await getCurrentUser();
  const photoUrl = await getPhotoUrl(currentUser.foto_profil_key);

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </div>
          <span className="font-semibold">Ajuan Pembayaran</span>
          <Badge variant="secondary">{roleLabel[session.role]}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <NotifBell href={notifHref[session.role]} />
          {session.role === "super_admin" && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link href="/users">
                  <Users />
                  User
                </Link>
              }
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar size="sm">
                  {photoUrl && <AvatarImage src={photoUrl} alt={displayName} />}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{displayName}</span>
              </Link>
            }
          />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  );
}
