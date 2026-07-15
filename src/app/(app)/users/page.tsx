import { requireRole } from "@/lib/auth";
import { listUsers, listDivisiOptions } from "@/services/userService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "./user-form-dialog";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  dirkeu: "Dirkeu",
  divisi: "Divisi",
};

export default async function UsersPage() {
  await requireRole("admin");
  const [users, divisiOptions] = await Promise.all([
    listUsers(),
    listDivisiOptions(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manajemen User</h1>
        <UserFormDialog divisiOptions={divisiOptions} />
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.nama_lengkap}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel[user.role]}</Badge>
                  </TableCell>
                  <TableCell>{user.nama_divisi ?? "-"}</TableCell>
                  <TableCell>
                    <UserFormDialog user={user} divisiOptions={divisiOptions} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
