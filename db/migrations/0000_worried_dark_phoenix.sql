CREATE TYPE "public"."status_ajuan" AS ENUM('Menunggu Approval', 'Ditolak', 'Disetujui', 'Selesai Dibayar', 'Menunggu Verifikasi', 'Perlu Revisi');--> statement-breakpoint
CREATE TYPE "public"."status_dana" AS ENUM('Surplus', 'Defisit', 'Sesuai');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'approval', 'divisi');--> statement-breakpoint
CREATE TABLE "lib_divisi" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lib_divisi_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"kode" varchar(20) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	"deleted_at" timestamp with time zone,
	"deleted_by" bigint,
	CONSTRAINT "lib_divisi_kode_key" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "tb_ajuan" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tb_ajuan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_divisi" bigint NOT NULL,
	"nama_pengaju" varchar(150) NOT NULL,
	"atas_nama_rekening" varchar(150) NOT NULL,
	"nomor_rekening" varchar(50) NOT NULL,
	"nama_bank" varchar(100) NOT NULL,
	"keterangan_kegiatan" text NOT NULL,
	"nominal_diajukan" numeric(15, 2) NOT NULL,
	"status" "status_ajuan" DEFAULT 'Menunggu Approval' NOT NULL,
	"id_approved_by" bigint,
	"approved_at" timestamp with time zone,
	"catatan_approval" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	"deleted_at" timestamp with time zone,
	"deleted_by" bigint,
	"kode_tracking" varchar(12),
	CONSTRAINT "tb_ajuan_kode_tracking_key" UNIQUE("kode_tracking")
);
--> statement-breakpoint
CREATE TABLE "tb_audit_trail" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tb_audit_trail_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_ajuan" bigint,
	"id_user" bigint,
	"aksi" varchar(50) NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" bigint
);
--> statement-breakpoint
CREATE TABLE "tb_bukti_transfer" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tb_bukti_transfer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_ajuan" bigint NOT NULL,
	"object_key" text NOT NULL,
	"nama_file" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	"deleted_at" timestamp with time zone,
	"deleted_by" bigint
);
--> statement-breakpoint
CREATE TABLE "tb_lpj" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tb_lpj_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_ajuan" bigint NOT NULL,
	"object_key" text NOT NULL,
	"nama_file" varchar(255) NOT NULL,
	"nominal_realisasi" numeric(15, 2) NOT NULL,
	"selisih_dana" numeric(15, 2) NOT NULL,
	"status_dana" "status_dana" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	"deleted_at" timestamp with time zone,
	"deleted_by" bigint
);
--> statement-breakpoint
CREATE TABLE "tb_user" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tb_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"id_divisi" bigint,
	"nama_lengkap" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	"deleted_at" timestamp with time zone,
	"deleted_by" bigint,
	"foto_profil_key" text,
	CONSTRAINT "tb_user_username_key" UNIQUE("username"),
	CONSTRAINT "chk_user_divisi" CHECK (((role = 'divisi'::user_role) AND (id_divisi IS NOT NULL)) OR ((role <> 'divisi'::user_role) AND (id_divisi IS NULL)))
);
--> statement-breakpoint
ALTER TABLE "tb_ajuan" ADD CONSTRAINT "tb_ajuan_id_divisi_fkey" FOREIGN KEY ("id_divisi") REFERENCES "public"."lib_divisi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_ajuan" ADD CONSTRAINT "tb_ajuan_id_approved_by_fkey" FOREIGN KEY ("id_approved_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_ajuan" ADD CONSTRAINT "tb_ajuan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_ajuan" ADD CONSTRAINT "tb_ajuan_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_ajuan" ADD CONSTRAINT "tb_ajuan_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_audit_trail" ADD CONSTRAINT "tb_audit_trail_id_ajuan_fkey" FOREIGN KEY ("id_ajuan") REFERENCES "public"."tb_ajuan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_audit_trail" ADD CONSTRAINT "tb_audit_trail_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_audit_trail" ADD CONSTRAINT "tb_audit_trail_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_bukti_transfer" ADD CONSTRAINT "tb_bukti_transfer_id_ajuan_fkey" FOREIGN KEY ("id_ajuan") REFERENCES "public"."tb_ajuan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_bukti_transfer" ADD CONSTRAINT "tb_bukti_transfer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_bukti_transfer" ADD CONSTRAINT "tb_bukti_transfer_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_bukti_transfer" ADD CONSTRAINT "tb_bukti_transfer_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_lpj" ADD CONSTRAINT "tb_lpj_id_ajuan_fkey" FOREIGN KEY ("id_ajuan") REFERENCES "public"."tb_ajuan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_lpj" ADD CONSTRAINT "tb_lpj_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_lpj" ADD CONSTRAINT "tb_lpj_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_lpj" ADD CONSTRAINT "tb_lpj_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."tb_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tb_user" ADD CONSTRAINT "tb_user_id_divisi_fkey" FOREIGN KEY ("id_divisi") REFERENCES "public"."lib_divisi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tb_ajuan_created_at" ON "tb_ajuan" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_ajuan_id_divisi" ON "tb_ajuan" USING btree ("id_divisi" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_ajuan_status" ON "tb_ajuan" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_audit_trail_id_ajuan" ON "tb_audit_trail" USING btree ("id_ajuan" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_bukti_transfer_id_ajuan" ON "tb_bukti_transfer" USING btree ("id_ajuan" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_lpj_id_ajuan" ON "tb_lpj" USING btree ("id_ajuan" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_user_id_divisi" ON "tb_user" USING btree ("id_divisi" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tb_user_role" ON "tb_user" USING btree ("role" enum_ops);