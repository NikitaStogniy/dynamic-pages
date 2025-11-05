CREATE TABLE "page_access_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_access_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "qr_expiry_minutes" integer;--> statement-breakpoint
ALTER TABLE "page_access_tokens" ADD CONSTRAINT "page_access_tokens_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "page_token_idx" ON "page_access_tokens" USING btree ("token");