-- =====================================================================
-- 0020: Strip v1 tables for Riff v2 pivot (FB cover generator only)
--
-- Riff v2 collapses to: paste YouTube URL → AI content + cover render.
-- The discovery / niche / channel / idea / board / template machinery
-- from v1 has no place in this flow. Drop the supporting tables.
--
-- Pre-launch — only the founder has data — so destructive drops are
-- acceptable. A pg_dump of the project should be taken before applying
-- this migration; rollback = restore from that dump.
--
-- Drops (CASCADE handles FKs):
--   board_ideas, boards
--   ideas
--   transcripts (caching only, regenerated on demand)
--   videos
--   channels
--   creative_styles
--   waitlist
--
-- Kept (still in use):
--   profiles, voice_profiles, recreated_drafts, allowed_emails,
--   user_settings, app_settings, jobs
--
-- After this migration, code paths in worker/app/routes/{cover,recreate,
-- quick_recreate}.py and worker/app/services/claude/recreate/_orchestrator.py
-- that query creative_styles will fail at runtime. Those paths are
-- exercised only by the deleted v1 frontend, so they are dead code
-- and will be replaced when the new /generate flow lands.
-- =====================================================================

-- Drop in dependency order (children first), CASCADE for safety.
DROP TABLE IF EXISTS public.board_ideas    CASCADE;
DROP TABLE IF EXISTS public.boards         CASCADE;
DROP TABLE IF EXISTS public.ideas          CASCADE;
DROP TABLE IF EXISTS public.transcripts    CASCADE;
DROP TABLE IF EXISTS public.videos         CASCADE;
DROP TABLE IF EXISTS public.channels       CASCADE;
DROP TABLE IF EXISTS public.creative_styles CASCADE;
DROP TABLE IF EXISTS public.waitlist       CASCADE;
