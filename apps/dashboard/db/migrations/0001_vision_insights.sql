CREATE TABLE IF NOT EXISTS "vision_insight_configs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"model_tier" text DEFAULT 'balanced' NOT NULL,
	"max_steps" integer DEFAULT 40 NOT NULL,
	"max_insights_per_project" integer DEFAULT 3 NOT NULL,
	"cooldown_hours" integer DEFAULT 6 NOT NULL,
	"lookback_days" integer DEFAULT 7 NOT NULL,
	"allowed_tools" jsonb DEFAULT '["traffic","funnels","events"]'::jsonb NOT NULL,
	"next_run_at" timestamp (3),
	"last_run_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	CONSTRAINT "vision_insight_configs_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vision_insight_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"requested_by_user_id" text,
	"reason" text DEFAULT 'scheduled' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"config_snapshot" jsonb NOT NULL,
	"started_at" timestamp (3),
	"finished_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vision_insights" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"run_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"suggestion" text NOT NULL,
	"root_cause" text,
	"severity" text NOT NULL,
	"sentiment" text NOT NULL,
	"type" text NOT NULL,
	"priority" integer NOT NULL,
	"confidence" text DEFAULT '0' NOT NULL,
	"change_percent" text,
	"subject_key" text DEFAULT '' NOT NULL,
	"dedupe_key" text,
	"metrics" jsonb,
	"evidence" jsonb,
	"actions" jsonb,
	"sources" jsonb DEFAULT '["traffic"]'::jsonb NOT NULL,
	"current_period_from" text NOT NULL,
	"current_period_to" text NOT NULL,
	"previous_period_from" text NOT NULL,
	"previous_period_to" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"investigation_depth" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp (3),
	"feedback_vote" text,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vision_insight_feedback" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_id" text NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"vote" text NOT NULL,
	"suppress_pattern" jsonb,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vision_insights_project_status_idx" ON "vision_insights" USING btree ("project_id", "status", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vision_insights_priority_idx" ON "vision_insights" USING btree ("project_id", "priority" DESC);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vision_insights_dedupe_uidx" ON "vision_insights" USING btree ("project_id", "dedupe_key") WHERE dedupe_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vision_insight_configs_next_run_idx" ON "vision_insight_configs" USING btree ("next_run_at") WHERE enabled = true;
