import type { Role } from "@/types";

export type User = {
  id: number;
  username: string;
  role: Role;
  id_divisi: number | null;
  nama_divisi: string | null;
  nama_lengkap: string | null;
  created_at: string;
};
