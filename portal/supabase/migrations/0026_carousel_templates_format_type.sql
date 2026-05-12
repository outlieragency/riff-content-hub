-- =====================================================================
-- 0026: carousel_templates.format_type
--
-- Earth's FB-post system gets the same "upload screenshot → AI parses
-- HTML + schema + writing prompt" workflow that carousel already has.
-- Instead of creating a parallel `fb_post_templates` table we add a
-- discriminator column so both formats share the gallery, uploader,
-- editor, and renderer code paths.
--
-- format_type values:
--   'carousel' — N slides, default 5, multi-slide editor (existing)
--   'fb_post'  — single cover image (1 slide), paired with a long FB
--                post body that's generated alongside the cover fields
--                by the recreate handler.
-- =====================================================================

alter table public.carousel_templates
  add column if not exists format_type text not null default 'carousel'
    check (format_type in ('carousel', 'fb_post'));

create index if not exists carousel_templates_format_idx
  on public.carousel_templates(user_id, format_type)
  where is_active;

comment on column public.carousel_templates.format_type is
  'Which Riff format this template targets: carousel (multi-slide) or fb_post (single cover).';
