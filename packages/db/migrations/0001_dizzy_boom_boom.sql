ALTER TABLE "llm_event" ALTER COLUMN "prompt_tokens" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "llm_event" ALTER COLUMN "prompt_tokens" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_event" ALTER COLUMN "completion_tokens" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "llm_event" ALTER COLUMN "completion_tokens" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_event" ALTER COLUMN "total_tokens" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "llm_event" ALTER COLUMN "total_tokens" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_event" ALTER COLUMN "cost" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "visitor_id" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "trace_id" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "parent_event_id" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "span_type" text DEFAULT 'generation' NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "cost_details" jsonb;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "output" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "tool_calls" jsonb;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "tool_definitions" jsonb;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "template_name" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "score" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "ttft_ms" integer;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "level" text DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "start_time" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "end_time" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "completion_start_time" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "environment" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "release" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "version" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "tags" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "model_parameters" jsonb;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "request_path" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "usage_unit" text DEFAULT 'tokens';--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "prompt_cache_read_tokens" integer;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "prompt_cache_write_tokens" integer;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "reasoning_tokens" integer;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "usage_details" jsonb;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "input_cost" numeric(12, 9);--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "output_cost" numeric(12, 9);--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "http_status_code" integer;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "prompt_id" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "prompt_version" integer;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "scores" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "llm_event" ADD COLUMN "body_truncated" boolean DEFAULT false;