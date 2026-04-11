-- Unschedule the pg_cron job created in 20260407120000_schedule_daily_briefing.sql.
--
-- That job used current_setting('app.settings.supabase_url') and
-- current_setting('app.settings.service_role_key') to build its HTTP request,
-- but those custom GUCs are not set (and cannot easily be set) on Supabase
-- hosted projects, so every run threw "unrecognized configuration parameter"
-- and failed silently in cron.job_run_details. No email ever fired.
--
-- The daily digest is now triggered by GitHub Actions; see
-- .github/workflows/daily-digest.yml.
DO $$
BEGIN
  PERFORM cron.unschedule('daily-briefing-email');
EXCEPTION WHEN OTHERS THEN
  -- Job may not exist (e.g. prior migration failed partway through).
  -- Nothing to clean up in that case.
  NULL;
END $$;
