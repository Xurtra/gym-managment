-- pg-boss owns its internal schema and applies its own versioned migrations
-- from PgBoss.start() with migrate=true. This migration records that the
-- application database intentionally includes the pg-boss-managed schema.
SELECT 1;
