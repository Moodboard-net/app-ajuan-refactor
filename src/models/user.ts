import type { Role } from "@/types";

export type User = {
  id: number;
  username: string;
  role: Role;
  nama_lengkap: string | null;
  foto_profil_key: string | null;
  created_at: string;
};
