-- =====================================================================
-- 0024: carousel_templates.last_draft
--
-- The editor at /carousel-templates/[id] keeps slide state in browser
-- React state. That works for a single session but loses everything on
-- reload — bad UX once Earth has spent 10 minutes writing 9 slides.
--
-- last_draft persists the in-progress slides + theme so reload returns
-- the user to exactly where they left off. Shape:
--   {
--     "slides": [ { "<field_key>": "<value>", ... }, ... ],
--     "theme":  { bg, fg, accent, font_heading, font_body }
--   }
--
-- This is a per-template scratch area. When we add a proper
-- `carousel_drafts` table later (named drafts, share, etc.), this
-- column can be deprecated or repurposed as "current open draft".
-- =====================================================================

alter table public.carousel_templates
  add column if not exists last_draft jsonb;

comment on column public.carousel_templates.last_draft is
  'Auto-saved scratch state from /carousel-templates/[id] editor — { slides:[FieldValues], theme }';
