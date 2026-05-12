-- =====================================================================
-- 0025: carousel_templates.writing_prompt
--
-- Per-template writing guidance for the AI slide generator. Layered on
-- top of the global `generate-carousel-slides.md` prompt so each
-- uploaded template can carry its own tone / structure rules.
--
-- Example: a "Bold quote" template might set
--   "Keep each slide to one punchy line under 12 words. Contrarian voice."
-- A "Long story" template might set
--   "Narrative slides — slide 1 = scene, slide 2-4 = build conflict,
--    slide 5 = payoff. 2-3 sentences per slide."
-- =====================================================================

alter table public.carousel_templates
  add column if not exists writing_prompt text not null default '';

comment on column public.carousel_templates.writing_prompt is
  'Per-template guidance for the slide generator AI, layered on top of the global generate-carousel-slides.md prompt.';
