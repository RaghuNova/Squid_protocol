-- Rotate legacy predictable QR values to 256-bit opaque secrets.
-- gen_random_uuid() is built into supported PostgreSQL versions.
UPDATE "AccessToken"
SET "tokenCode" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
