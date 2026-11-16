CREATE TYPE "public"."ABTestStatus" AS ENUM('draft', 'running', 'stopped');--> statement-breakpoint
CREATE TYPE "public"."AccessLevel" AS ENUM('read', 'write', 'admin');--> statement-breakpoint
CREATE TYPE "public"."ClientType" AS ENUM('read', 'write', 'root');--> statement-breakpoint
CREATE TYPE "public"."PaymentConnectionStatus" AS ENUM('pending', 'active', 'failed', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."PaymentProvider" AS ENUM('stripe', 'paddle', 'polar', 'lemonsqueezy');--> statement-breakpoint
CREATE TABLE "ab_test" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"goal_event_name" text NOT NULL,
	"status" "ABTestStatus" DEFAULT 'draft' NOT NULL,
	"started_at" timestamp (3),
	"stopped_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_test_session" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"session_id" text NOT NULL,
	"converted" boolean NOT NULL,
	"converted_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_test_variant" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" text NOT NULL,
	"name" text NOT NULL,
	"weight" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"secret" text,
	"type" "ClientType" DEFAULT 'write' NOT NULL,
	"project_id" text,
	"organization_id" text,
	"ignoreCorsAndSecret" boolean NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_data" (
	"event_data_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"project_event_id" text NOT NULL,
	"data_key" text NOT NULL,
	"string_value" text,
	"number_value" numeric(65, 30),
	"date_value" timestamp (3),
	"data_type" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_IntegrationToNotificationRule" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_by_id" text NOT NULL,
	"organization_id" text,
	"projectAccess" text[] NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link" (
	"link_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"slug" text NOT NULL,
	"user_id" text,
	"organization_id" text,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "link_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "member" (
	"member_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"send_to_app" boolean NOT NULL,
	"send_to_email" boolean NOT NULL,
	"integration_id" text,
	"notification_rule_id" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "notification_rules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"projectId" text NOT NULL,
	"sendToApp" boolean NOT NULL,
	"sendToEmail" boolean NOT NULL,
	"config" jsonb NOT NULL,
	"template" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"organization_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"access_code" text,
	"logo_url" text,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "organization_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "payment_connection" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"provider" "PaymentProvider" NOT NULL,
	"status" "PaymentConnectionStatus" DEFAULT 'pending' NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"webhook_id" text,
	"webhook_secret" text,
	"started_at" timestamp (3),
	"completed_at" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_connection_id" text NOT NULL,
	"project_id" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"currency" text NOT NULL,
	"amount" numeric(65, 30) NOT NULL,
	"status" text NOT NULL,
	"project_id_meta" text,
	"visitor_id" text,
	"device_id" text,
	"raw_payload" jsonb DEFAULT '{}' NOT NULL,
	"attributed" boolean NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pixel" (
	"pixel_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"user_id" text,
	"organization_id" text,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "pixel_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"project_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"share_id" text,
	"reset_at" timestamp (3),
	"user_id" text,
	"organization_id" text,
	"created_by" text,
	"replay_enabled" boolean NOT NULL,
	"replay_config" jsonb,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "project_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE "project_access" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"level" "AccessLevel" NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "project_event" (
	"event_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"url_path" text NOT NULL,
	"url_query" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"referrer_path" text,
	"referrer_query" text,
	"referrer_domain" text,
	"page_title" text,
	"gclid" text,
	"fbclid" text,
	"msclkid" text,
	"ttclid" text,
	"li_fat_id" text,
	"twclid" text,
	"event_type" integer DEFAULT 1 NOT NULL,
	"event_name" text,
	"tag" text,
	"hostname" text,
	"lcp" numeric(65, 30),
	"inp" numeric(65, 30),
	"cls" numeric(65, 30),
	"fcp" numeric(65, 30),
	"ttfb" numeric(65, 30)
);
--> statement-breakpoint
CREATE TABLE "report" (
	"report_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "revenue" (
	"revenue_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"event_id" text NOT NULL,
	"event_name" text NOT NULL,
	"revenue" numeric(65, 30),
	"currency" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "segment" (
	"segment_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "session_replay" (
	"replay_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"events" "bytea" NOT NULL,
	"event_count" integer NOT NULL,
	"started_at" timestamp (3) NOT NULL,
	"ended_at" timestamp (3) NOT NULL,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_replay_saved" (
	"saved_replay_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"project_id" text NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "share" (
	"share_id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"name" text NOT NULL,
	"share_type" text NOT NULL,
	"slug" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"user_id" text,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	CONSTRAINT "share_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"role" text NOT NULL,
	"logo_url" text,
	"display_name" text,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "user_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visitor" (
	"visitor_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"browser" text,
	"os" text,
	"device" text,
	"screen" text,
	"language" text,
	"country" text,
	"region" text,
	"city" text,
	"latitude" numeric(65, 30),
	"longitude" numeric(65, 30),
	"distinct_id" text,
	"first_name" text,
	"last_name" text,
	"email" text,
	"avatar" text,
	"properties" jsonb DEFAULT '{}',
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visitor_data" (
	"visitor_data_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"data_key" text NOT NULL,
	"string_value" text,
	"number_value" numeric(65, 30),
	"date_value" timestamp (3),
	"data_type" integer NOT NULL,
	"distinct_id" text,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ab_test" ADD CONSTRAINT "ab_test_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ab_test_session" ADD CONSTRAINT "ab_test_session_test_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."ab_test"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ab_test_session" ADD CONSTRAINT "ab_test_session_variant_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."ab_test_variant"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ab_test_variant" ADD CONSTRAINT "ab_test_variant_test_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."ab_test"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_data" ADD CONSTRAINT "event_data_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_data" ADD CONSTRAINT "event_data_projectEvent_fkey" FOREIGN KEY ("project_event_id") REFERENCES "public"."project_event"("event_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_IntegrationToNotificationRule" ADD CONSTRAINT "_IntegrationToNotificationRule_NotificationRule_fkey" FOREIGN KEY ("A") REFERENCES "public"."notification_rules"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_IntegrationToNotificationRule" ADD CONSTRAINT "_IntegrationToNotificationRule_Integration_fkey" FOREIGN KEY ("B") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_integration_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notificationRule_fkey" FOREIGN KEY ("notification_rule_id") REFERENCES "public"."notification_rules"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_project_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment_connection" ADD CONSTRAINT "payment_connection_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_paymentConnection_fkey" FOREIGN KEY ("payment_connection_id") REFERENCES "public"."payment_connection"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pixel" ADD CONSTRAINT "pixel_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pixel" ADD CONSTRAINT "pixel_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_createUser_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_access" ADD CONSTRAINT "project_access_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_event" ADD CONSTRAINT "project_event_visitor_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("visitor_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_visitor_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("visitor_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "segment" ADD CONSTRAINT "segment_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session_replay" ADD CONSTRAINT "session_replay_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session_replay_saved" ADD CONSTRAINT "session_replay_saved_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "share" ADD CONSTRAINT "share_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "share" ADD CONSTRAINT "share_project_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "visitor_data" ADD CONSTRAINT "visitor_data_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "visitor_data" ADD CONSTRAINT "visitor_data_visitor_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("visitor_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "ABTestSession_testId_sessionId_key" ON "ab_test_session" USING btree ("test_id","session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "PaymentConnection_projectId_provider_key" ON "payment_connection" USING btree ("project_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "PaymentEvent_paymentConnectionId_providerEventId_key" ON "payment_event" USING btree ("payment_connection_id","provider_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "SessionReplaySaved_projectId_sessionId_key" ON "session_replay_saved" USING btree ("project_id","session_id");