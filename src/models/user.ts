import { tbUser } from "@db/schema";
import type { Role } from "@/types";

export type User = {
  id: number;
  username: string;
  role: Role;
  nama_lengkap: string | null;
  foto_profil_key: string | null;
  created_at: string;
};

/** Kolom tb_user yang dipetakan ke shape User (snake_case), dipakai lewat Drizzle `db.select(userColumns)`. */
export const userColumns = {
  id: tbUser.id,
  username: tbUser.username,
  role: tbUser.role,
  nama_lengkap: tbUser.namaLengkap,
  foto_profil_key: tbUser.fotoProfilKey,
  created_at: tbUser.createdAt,
};
