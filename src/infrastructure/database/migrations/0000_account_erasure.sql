CREATE TYPE "account_erasure_status" AS ENUM (
	'pending',
	'processing',
	'retry',
	'completed',
	'failed'
);
--> statement-breakpoint
CREATE TABLE "account_erasure_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_event_id" varchar(255) NOT NULL,
	"clerk_user_id" varchar(100),
	"subject_hash" varchar(64) NOT NULL,
	"status" "account_erasure_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"received_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"started_at" timestamp with time zone,
	"database_deleted_at" timestamp with time zone,
	"storage_deleted_at" timestamp with time zone,
	"cache_deleted_at" timestamp with time zone,
	"reconciled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_error_code" varchar(100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_erasure_requests_webhook_event_id_idx"
	ON "account_erasure_requests" USING btree ("webhook_event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "account_erasure_requests_subject_hash_idx"
	ON "account_erasure_requests" USING btree ("subject_hash");
--> statement-breakpoint
CREATE INDEX "account_erasure_requests_clerk_user_id_idx"
	ON "account_erasure_requests" USING btree ("clerk_user_id");
--> statement-breakpoint
CREATE INDEX "account_erasure_requests_eligible_idx"
	ON "account_erasure_requests" USING btree ("status", "next_attempt_at");
