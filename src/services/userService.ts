"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, requireRole } from "@/lib/auth";
import type { Role, ActionState } from "@/types";
import type { User } from "@/models/user";

const roleHome: Record<Role, string> = {
  super_admin: "/cek-ajuan",
  approval: "/approval",
};

export type LoginState = { error?: string };

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

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
    {
      id: number;
      username: string;
      password_hash: string;
      role: Role;
      nama_lengkap: string | null;
    }[]
  >`
    SELECT id, username, password_hash, role, nama_lengkap
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
    namaLengkap: user.nama_lengkap,
  });

  redirect(roleHome[user.role]);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function listUsers(): Promise<User[]> {
  await requireRole("super_admin");
  return sql<User[]>`
    SELECT u.id, u.username, u.role, u.nama_lengkap, u.foto_profil_key, u.created_at
    FROM tb_user u
    WHERE u.deleted_at IS NULL
    ORDER BY u.role, u.username
  `;
}

const userFormSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
  role: z.enum(["super_admin", "approval"]),
  password: z.string().optional(),
});

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole("super_admin");

  const parsed = userFormSchema
    .safeExtend({ password: z.string().min(6, "Password minimal 6 karakter") })
    .safeParse({
      username: formData.get("username"),
      namaLengkap: formData.get("namaLengkap"),
      role: formData.get("role"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await sql`
      INSERT INTO tb_user (
        username, password_hash, role, nama_lengkap, created_by, updated_by
      ) VALUES (
        ${parsed.data.username}, ${passwordHash}, ${parsed.data.role},
        ${parsed.data.namaLengkap}, ${admin.userId}, ${admin.userId}
      )
    `;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "23505") {
      return { error: "Username sudah dipakai" };
    }
    throw err;
  }

  revalidatePath("/users");
  return { success: true };
}

const updateUserSchema = userFormSchema.and(
  z.object({ id: z.coerce.number() })
);

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole("super_admin");

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    username: formData.get("username"),
    namaLengkap: formData.get("namaLengkap"),
    role: formData.get("role"),
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await sql`
    UPDATE tb_user
    SET nama_lengkap = ${parsed.data.namaLengkap},
        role = ${parsed.data.role},
        updated_by = ${admin.userId},
        updated_at = now()
    WHERE id = ${parsed.data.id}
  `;

  if (parsed.data.password) {
    if (parsed.data.password.length < 6) {
      return { error: "Password minimal 6 karakter" };
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await sql`
      UPDATE tb_user
      SET password_hash = ${passwordHash}, updated_by = ${admin.userId}, updated_at = now()
      WHERE id = ${parsed.data.id}
    `;
    await sql`
      INSERT INTO tb_audit_trail (id_user, aksi, detail, created_by)
      VALUES (${parsed.data.id}, 'reset_password_user', ${sql.json({ by: admin.username })}, ${admin.userId})
    `;
  }

  revalidatePath("/users");
  return { success: true };
}
