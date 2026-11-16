ALTER TABLE "project_event" DROP CONSTRAINT IF EXISTS "project_event_visitor_fkey";
ALTER TABLE "visitor_data" DROP CONSTRAINT IF EXISTS "visitor_data_visitor_fkey";
ALTER TABLE "revenue" DROP CONSTRAINT IF EXISTS "revenue_visitor_fkey";
