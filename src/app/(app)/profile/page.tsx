import { getCurrentUser, getPhotoUrl } from "@/services/profileService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditNamaDialog } from "./edit-nama-dialog";
import { EditFotoDialog } from "./edit-foto-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  approval: "Approval",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const photoUrl = await getPhotoUrl(user.foto_profil_key);
  const displayName = user.nama_lengkap ?? user.username;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Diri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {photoUrl && <AvatarImage src={photoUrl} alt={displayName} />}
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.username}</p>
              <Badge variant="secondary">{roleLabel[user.role]}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <EditFotoDialog />
            <EditNamaDialog namaLengkap={user.nama_lengkap ?? ""} />
            <ChangePasswordDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
