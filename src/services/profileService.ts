"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadFile, getFileUrl } from "@/lib/storage";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { ActionState } from "@/types";
import type { User } from "@/models/user";

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

export async function getCurrentUser(): Promise<User> {
  const session = await requireUser();
  const rows = await sql<User[]>`
    SELECT id, username, role, nama_lengkap, foto_profil_key, created_at
    FROM tb_user
    WHERE id = ${session.userId} AND deleted_at IS NULL
  `;
  const user = rows[0];
  if (!user) throw new Error("User sesi tidak ditemukan");
  return user;
}

export async function getPhotoUrl(fotoProfilKey: string | null): Promise<string | null> {
  if (!fotoProfilKey) return null;
  return getFileUrl(fotoProfilKey);
}

const updateNamaSchema = z.object({
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
});

export async function updateNamaAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = updateNamaSchema.safeParse({
    namaLengkap: formData.get("namaLengkap"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await sql`
    UPDATE tb_user
    SET nama_lengkap = ${parsed.data.namaLengkap},
        updated_by = ${session.userId},
        updated_at = now()
    WHERE id = ${session.userId}
  `;

  revalidatePath("/profile");
  return { success: true };
}

export async function updatePhotoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "File foto wajib diunggah" };
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return { error: "Format foto harus JPG, PNG, atau WEBP" };
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return { error: "Ukuran foto maksimal 2MB" };
  }

  const { objectKey } = await uploadFile("avatar", file);

  await sql`
    UPDATE tb_user
    SET foto_profil_key = ${objectKey},
        updated_by = ${session.userId},
        updated_at = now()
    WHERE id = ${session.userId}
  `;

  revalidatePath("/profile");
  return { success: true };
}

const changePasswordSchema = z.object({
  passwordLama: z.string().min(1, "Password lama wajib diisi"),
  passwordBaru: z.string().min(6, "Password baru minimal 6 karakter"),
});

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    passwordLama: formData.get("passwordLama"),
    passwordBaru: formData.get("passwordBaru"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM tb_user WHERE id = ${session.userId} AND deleted_at IS NULL
  `;
  const current = rows[0];
  if (!current || !(await verifyPassword(parsed.data.passwordLama, current.password_hash))) {
    return { error: "Password lama salah" };
  }

  const passwordHash = await hashPassword(parsed.data.passwordBaru);
  await sql`
    UPDATE tb_user
    SET password_hash = ${passwordHash}, updated_by = ${session.userId}, updated_at = now()
    WHERE id = ${session.userId}
  `;

  return { success: true };
}
