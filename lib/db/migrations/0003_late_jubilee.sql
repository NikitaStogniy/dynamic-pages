CREATE TABLE "uploadcare_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"file_url" text NOT NULL,
	"user_id" integer NOT NULL,
	"file_name" text,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uploadcare_files_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
DROP INDEX "pages_user_id_idx";--> statement-breakpoint
ALTER TABLE "uploadcare_files" ADD CONSTRAINT "uploadcare_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "file_id_idx" ON "uploadcare_files" USING btree ("file_id");