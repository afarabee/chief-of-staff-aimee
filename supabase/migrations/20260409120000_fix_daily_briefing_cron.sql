-- Fix: previous cron job used current_setting() with 1 arg, which throws if the setting doesn't exist.
-- This caused the cron job to silently fail, preventing the daily digest email from being sent.

-- Remove the broken schedule
SELECT cron.unschedule('daily-briefing-email');

-- Set the Supabase URL (public/deterministic from project ID)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://npngxiprlrsodvggbaqt.supabase.co';

-- MANUAL STEP REQUIRED: Set the service role key in Supabase SQL Editor:
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<your-service-role-key>';
--   SELECT pg_reload_conf();

-- Recreate the cron job using current_setting with 2-arg form (returns NULL instead of throwing)
SELECT cron.schedule(
  'daily-briefing-email',
  '15 11 * * *',
  $$
  SELECT net.http_post(
    url := coalesce(
      current_setting('app.settings.supabase_url', true),
      'https://npngxiprlrsodvggbaqt.supabase.co'
    ) || '/functions/v1/send-daily-digest',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
  $$
);
