"use server";

import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tbUser, tbAuditTrail } from "@db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, requireRole } from "@/lib/auth";
import type { Role, ActionState } from "@/types";
import { userColumns, type User } from "@/models/user";

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

  const rows = await db
    .select({
      id: tbUser.id,
      username: tbUser.username,
      passwordHash: tbUser.passwordHash,
      role: tbUser.role,
      namaLengkap: tbUser.namaLengkap,
    })
    .from(tbUser)
    .where(and(eq(tbUser.username, parsed.data.username), isNull(tbUser.deletedAt)));

  const user = rows[0];
  if (!user) {
    return { error: "Username atau password salah" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Username atau password salah" };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role as Role,
    namaLengkap: user.namaLengkap,
  });

  redirect(roleHome[user.role as Role]);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function listUsers(): Promise<User[]> {
  await requireRole("super_admin");
  const rows = await db
    .select(userColumns)
    .from(tbUser)
    .where(isNull(tbUser.deletedAt))
    .orderBy(tbUser.role, tbUser.username);

  return rows.map((row) => ({ ...row, role: row.role as Role }));
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
    await db.insert(tbUser).values({
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role,
      namaLengkap: parsed.data.namaLengkap,
      createdBy: admin.userId,
      updatedBy: admin.userId,
    });
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

  await db
    .update(tbUser)
    .set({
      namaLengkap: parsed.data.namaLengkap,
      role: parsed.data.role,
      updatedBy: admin.userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tbUser.id, parsed.data.id));

  if (parsed.data.password) {
    if (parsed.data.password.length < 6) {
      return { error: "Password minimal 6 karakter" };
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await db
      .update(tbUser)
      .set({ passwordHash, updatedBy: admin.userId, updatedAt: new Date().toISOString() })
      .where(eq(tbUser.id, parsed.data.id));

    await db.insert(tbAuditTrail).values({
      idUser: parsed.data.id,
      aksi: "reset_password_user",
      detail: { by: admin.username },
      createdBy: admin.userId,
    });
  }

  revalidatePath("/users");
  return { success: true };
}
