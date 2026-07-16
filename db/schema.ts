import { pgTable, text, timestamp, index, foreignKey, unique, bigint, varchar, numeric, check, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const statusAjuan = pgEnum("status_ajuan", ['Menunggu Approval', 'Ditolak', 'Disetujui', 'Selesai Dibayar', 'Menunggu Verifikasi', 'Perlu Revisi'])
export const statusDana = pgEnum("status_dana", ['Surplus', 'Defisit', 'Sesuai'])
export const userRole = pgEnum("user_role", ['super_admin', 'approval', 'divisi'])


export const tbAjuan = pgTable("tb_ajuan", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tb_ajuan_id_seq", startWith: 1, increment: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idDivisi: bigint("id_divisi", { mode: "number" }).notNull(),
	namaPengaju: varchar("nama_pengaju", { length: 150 }).notNull(),
	atasNamaRekening: varchar("atas_nama_rekening", { length: 150 }).notNull(),
	nomorRekening: varchar("nomor_rekening", { length: 50 }).notNull(),
	namaBank: varchar("nama_bank", { length: 100 }).notNull(),
	keteranganKegiatan: text("keterangan_kegiatan").notNull(),
	nominalDiajukan: numeric("nominal_diajukan", { precision: 15, scale:  2 }).notNull(),
	status: statusAjuan().default('Menunggu Approval').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idApprovedBy: bigint("id_approved_by", { mode: "number" }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	catatanApproval: text("catatan_approval"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdBy: bigint("created_by", { mode: "number" }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedBy: bigint("updated_by", { mode: "number" }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deletedBy: bigint("deleted_by", { mode: "number" }),
	kodeTracking: varchar("kode_tracking", { length: 12 }),
}, (table) => [
	index("idx_tb_ajuan_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_tb_ajuan_id_divisi").using("btree", table.idDivisi.asc().nullsLast().op("int8_ops")),
	index("idx_tb_ajuan_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.idDivisi],
			foreignColumns: [libDivisi.id],
			name: "tb_ajuan_id_divisi_fkey"
		}),
	foreignKey({
			columns: [table.idApprovedBy],
			foreignColumns: [tbUser.id],
			name: "tb_ajuan_id_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [tbUser.id],
			name: "tb_ajuan_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [tbUser.id],
			name: "tb_ajuan_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [tbUser.id],
			name: "tb_ajuan_deleted_by_fkey"
		}),
	unique("tb_ajuan_kode_tracking_key").on(table.kodeTracking),
]);

export const tbUser = pgTable("tb_user", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tb_user_id_seq", startWith: 1, increment: 1 }),
	username: varchar({ length: 50 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	role: userRole().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idDivisi: bigint("id_divisi", { mode: "number" }),
	namaLengkap: varchar("nama_lengkap", { length: 150 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdBy: bigint("created_by", { mode: "number" }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedBy: bigint("updated_by", { mode: "number" }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deletedBy: bigint("deleted_by", { mode: "number" }),
	fotoProfilKey: text("foto_profil_key"),
	notifLastSeenAt: timestamp("notif_last_seen_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_tb_user_id_divisi").using("btree", table.idDivisi.asc().nullsLast().op("int8_ops")),
	index("idx_tb_user_role").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.idDivisi],
			foreignColumns: [libDivisi.id],
			name: "tb_user_id_divisi_fkey"
		}),
	unique("tb_user_username_key").on(table.username),
	check("chk_user_divisi", sql`((role = 'divisi'::user_role) AND (id_divisi IS NOT NULL)) OR ((role <> 'divisi'::user_role) AND (id_divisi IS NULL))`),
]);

export const libDivisi = pgTable("lib_divisi", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "lib_divisi_id_seq", startWith: 1, increment: 1 }),
	kode: varchar({ length: 20 }).notNull(),
	nama: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdBy: bigint("created_by", { mode: "number" }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedBy: bigint("updated_by", { mode: "number" }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deletedBy: bigint("deleted_by", { mode: "number" }),
}, (table) => [
	unique("lib_divisi_kode_key").on(table.kode),
]);

export const tbBuktiTransfer = pgTable("tb_bukti_transfer", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tb_bukti_transfer_id_seq", startWith: 1, increment: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idAjuan: bigint("id_ajuan", { mode: "number" }).notNull(),
	objectKey: text("object_key").notNull(),
	namaFile: varchar("nama_file", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdBy: bigint("created_by", { mode: "number" }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedBy: bigint("updated_by", { mode: "number" }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deletedBy: bigint("deleted_by", { mode: "number" }),
}, (table) => [
	index("idx_tb_bukti_transfer_id_ajuan").using("btree", table.idAjuan.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.idAjuan],
			foreignColumns: [tbAjuan.id],
			name: "tb_bukti_transfer_id_ajuan_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [tbUser.id],
			name: "tb_bukti_transfer_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [tbUser.id],
			name: "tb_bukti_transfer_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [tbUser.id],
			name: "tb_bukti_transfer_deleted_by_fkey"
		}),
]);

export const tbLpj = pgTable("tb_lpj", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tb_lpj_id_seq", startWith: 1, increment: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idAjuan: bigint("id_ajuan", { mode: "number" }).notNull(),
	objectKey: text("object_key").notNull(),
	namaFile: varchar("nama_file", { length: 255 }).notNull(),
	nominalRealisasi: numeric("nominal_realisasi", { precision: 15, scale:  2 }).notNull(),
	selisihDana: numeric("selisih_dana", { precision: 15, scale:  2 }).notNull(),
	statusDana: statusDana("status_dana").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdBy: bigint("created_by", { mode: "number" }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedBy: bigint("updated_by", { mode: "number" }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deletedBy: bigint("deleted_by", { mode: "number" }),
}, (table) => [
	index("idx_tb_lpj_id_ajuan").using("btree", table.idAjuan.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.idAjuan],
			foreignColumns: [tbAjuan.id],
			name: "tb_lpj_id_ajuan_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [tbUser.id],
			name: "tb_lpj_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [tbUser.id],
			name: "tb_lpj_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [tbUser.id],
			name: "tb_lpj_deleted_by_fkey"
		}),
]);

export const tbAuditTrail = pgTable("tb_audit_trail", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tb_audit_trail_id_seq", startWith: 1, increment: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idAjuan: bigint("id_ajuan", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUser: bigint("id_user", { mode: "number" }),
	aksi: varchar({ length: 50 }).notNull(),
	detail: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdBy: bigint("created_by", { mode: "number" }),
}, (table) => [
	index("idx_tb_audit_trail_id_ajuan").using("btree", table.idAjuan.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.idAjuan],
			foreignColumns: [tbAjuan.id],
			name: "tb_audit_trail_id_ajuan_fkey"
		}),
	foreignKey({
			columns: [table.idUser],
			foreignColumns: [tbUser.id],
			name: "tb_audit_trail_id_user_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [tbUser.id],
			name: "tb_audit_trail_created_by_fkey"
		}),
]);
