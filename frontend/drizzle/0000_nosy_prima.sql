CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "kemenag_surat";
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kemenag_surat"."surat_keluar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"nomor_surat" text NOT NULL,
	"tanggal_surat" date NOT NULL,
	"agenda" text,
	"tujuan_surat" text NOT NULL,
	"perihal" text NOT NULL,
	"unit_kerja" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"lampiran" text,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surat_keluar_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "kemenag_surat"."surat_masuk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"nomor_surat" text NOT NULL,
	"tanggal_surat" date NOT NULL,
	"tanggal_terima" date NOT NULL,
	"asal_surat" text NOT NULL,
	"perihal" text NOT NULL,
	"agenda" text,
	"status" text DEFAULT 'published' NOT NULL,
	"lampiran" text,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surat_masuk_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "kemenag_surat"."surat_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kemenag_surat"."pengguna" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kemenag_surat"."surat_master_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kategori" text NOT NULL,
	"label" text NOT NULL,
	"warna" text DEFAULT 'emerald' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kemenag_surat"."surat_keluar" ADD CONSTRAINT "surat_keluar_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kemenag_surat"."surat_keluar" ADD CONSTRAINT "surat_keluar_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kemenag_surat"."surat_masuk" ADD CONSTRAINT "surat_masuk_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kemenag_surat"."surat_masuk" ADD CONSTRAINT "surat_masuk_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_nomor_surat" ON "kemenag_surat"."surat_keluar" USING btree ("nomor_surat");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_tanggal_surat" ON "kemenag_surat"."surat_keluar" USING btree ("tanggal_surat");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_tujuan_surat" ON "kemenag_surat"."surat_keluar" USING btree ("tujuan_surat");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_unit_kerja" ON "kemenag_surat"."surat_keluar" USING btree ("unit_kerja");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_perihal" ON "kemenag_surat"."surat_keluar" USING btree ("perihal");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_deleted_at" ON "kemenag_surat"."surat_keluar" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_created_at" ON "kemenag_surat"."surat_keluar" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_surat_keluar_deleted_created" ON "kemenag_surat"."surat_keluar" USING btree ("deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_nomor_surat" ON "kemenag_surat"."surat_masuk" USING btree ("nomor_surat");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_tanggal_surat" ON "kemenag_surat"."surat_masuk" USING btree ("tanggal_surat");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_tanggal_terima" ON "kemenag_surat"."surat_masuk" USING btree ("tanggal_terima");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_asal_surat" ON "kemenag_surat"."surat_masuk" USING btree ("asal_surat");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_perihal" ON "kemenag_surat"."surat_masuk" USING btree ("perihal");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_deleted_at" ON "kemenag_surat"."surat_masuk" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_created_at" ON "kemenag_surat"."surat_masuk" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_surat_masuk_deleted_created" ON "kemenag_surat"."surat_masuk" USING btree ("deleted_at","created_at");