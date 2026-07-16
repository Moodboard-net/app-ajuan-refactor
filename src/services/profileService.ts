"use server";

import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tbUser } from "@db/schema";
import { uploadFile, getFileUrl } from "@/lib/storage";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { ActionState, Role } from "@/types";
import { userColumns, type User } from "@/models/user";

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

export async function getCurrentUser(): Promise<User> {
  const session = await requireUser();
  const rows = await db
    .select(userColumns)
    .from(tbUser)
    .where(and(eq(tbUser.id, session.userId), isNull(tbUser.deletedAt)));

  const user = rows[0];
  if (!user) throw new Error("User sesi tidak ditemukan");
  return { ...user, role: user.role as Role };
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

  await db
    .update(tbUser)
    .set({
      namaLengkap: parsed.data.namaLengkap,
      updatedBy: session.userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tbUser.id, session.userId));

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

  await db
    .update(tbUser)
    .set({
      fotoProfilKey: objectKey,
      updatedBy: session.userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tbUser.id, session.userId));

  revalidatePath("/profile");
  return { success: true };
}

const verifyPasswordLamaSchema = z.object({
  passwordLama: z.string().min(1, "Password lama wajib diisi"),
});

/**
 * Langkah 1 dari wizard ganti password: hanya untuk UX (memberi tahu user
 * lebih awal kalau salah). Ini BUKAN gerbang keamanan — changePasswordAction
 * tetap memverifikasi ulang password lama secara independen, karena hasil
 * fungsi ini bisa dipalsukan kalau server action lain dipanggil langsung.
 */
export async function verifyPasswordLamaAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = verifyPasswordLamaSchema.safeParse({
    passwordLama: formData.get("passwordLama"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const rows = await db
    .select({ passwordHash: tbUser.passwordHash })
    .from(tbUser)
    .where(and(eq(tbUser.id, session.userId), isNull(tbUser.deletedAt)));

  const current = rows[0];
  if (!current || !(await verifyPassword(parsed.data.passwordLama, current.passwordHash))) {
    return { error: "Password lama salah" };
  }

  return { success: true };
}

const changePasswordSchema = z
  .object({
    passwordLama: z.string().min(1, "Password lama wajib diisi"),
    passwordBaru: z.string().min(6, "Password baru minimal 6 karakter"),
    konfirmasiPasswordBaru: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPasswordBaru, {
    message: "Konfirmasi password tidak cocok",
    path: ["konfirmasiPasswordBaru"],
  });

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    passwordLama: formData.get("passwordLama"),
    passwordBaru: formData.get("passwordBaru"),
    konfirmasiPasswordBaru: formData.get("konfirmasiPasswordBaru"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const rows = await db
    .select({ passwordHash: tbUser.passwordHash })
    .from(tbUser)
    .where(and(eq(tbUser.id, session.userId), isNull(tbUser.deletedAt)));

  const current = rows[0];
  if (!current || !(await verifyPassword(parsed.data.passwordLama, current.passwordHash))) {
    return { error: "Password lama salah" };
  }

  const passwordHash = await hashPassword(parsed.data.passwordBaru);
  await db
    .update(tbUser)
    .set({
      passwordHash,
      updatedBy: session.userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tbUser.id, session.userId));

  return { success: true };
}
