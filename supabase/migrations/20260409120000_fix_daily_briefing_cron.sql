-- Fix: previous cron job used current_setting() with 1 arg, which throws if the setting doesn't exist.
-- This caused the cron job to silently fail, preventing the daily digest email from being sent.

-- Remove the broken schedule
SELECT cron.unschedule('daily-briefing-email');

-- MANUAL STEP: Schedule the cron job by running this in the Supabase SQL Editor,
-- replacing <your-service-role-key> with your actual key:
--
--   SELECT cron.schedule(
--     'daily-briefing-email',
--     '15 11 * * *',
--     $$
--     SELECT net.http_post(
--       url := 'https://npngxiprlrsodvggbaqt.supabase.co/functions/v1/send-daily-digest',
--       body := '{}'::jsonb,
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer <your-service-role-key>'
--       )
--     );
--     $$
--   );
