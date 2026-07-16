"use server";

import { eq, and, gt, count } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tbUser, tbAuditTrail } from "@db/schema";
import type { Role } from "@/types";

/**
 * Aksi tb_audit_trail yang relevan untuk tiap role, dipakai sebagai penanda
 * "ajuan baru" -- BUKAN tb_ajuan.created_at (ajuan yang sampai ke antrian
 * Approval dibuat jauh sebelumnya lewat form publik) atau updated_at
 * (berubah pada setiap edit apa pun).
 */
const NOTIF_AKSI: Record<Role, string> = {
  super_admin: "buat_ajuan_publik",
  approval: "ajukan_ke_approval",
};

export async function getNotifCount(): Promise<number> {
  const session = await requireUser();

  const rows = await db
    .select({ notifLastSeenAt: tbUser.notifLastSeenAt })
    .from(tbUser)
    .where(eq(tbUser.id, session.userId));
  const notifLastSeenAt = rows[0]?.notifLastSeenAt ?? null;

  const aksi = NOTIF_AKSI[session.role];
  const conditions = [eq(tbAuditTrail.aksi, aksi)];
  if (notifLastSeenAt) {
    conditions.push(gt(tbAuditTrail.createdAt, notifLastSeenAt));
  }

  const result = await db
    .select({ jumlah: count() })
    .from(tbAuditTrail)
    .where(and(...conditions));

  return result[0]?.jumlah ?? 0;
}

export async function markNotifSeen(): Promise<void> {
  const session = await requireUser();

  await db
    .update(tbUser)
    .set({ notifLastSeenAt: new Date().toISOString() })
    .where(eq(tbUser.id, session.userId));
}
