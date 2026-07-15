"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/server/db";
import { verifyPassword } from "@/server/password";
import { createSession, destroySession, type Role } from "@/server/auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginState = { error?: string };

const roleHome: Record<Role, string> = {
  admin: "/cek-ajuan",
  dirkeu: "/approval",
  divisi: "/ajuan",
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Username dan password wajib diisi" };
  }

  const rows = await sql<
    { id: number; username: string; password_hash: string; role: Role; id_divisi: number | null; nama_lengkap: string | null }[]
  >`
    SELECT id, username, password_hash, role, id_divisi, nama_lengkap
    FROM tb_user
    WHERE username = ${parsed.data.username} AND deleted_at IS NULL
  `;

  const user = rows[0];
  if (!user) {
    return { error: "Username atau password salah" };
  }

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    return { error: "Username atau password salah" };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    idDivisi: user.id_divisi,
    namaLengkap: user.nama_lengkap,
  });

  redirect(roleHome[user.role]);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
