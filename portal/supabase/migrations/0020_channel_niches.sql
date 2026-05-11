-- =====================================================================
-- 0020: channel niches — Eden-style niche filter on /discover
--
-- Earth tags each tracked channel with one or more niche labels so the
-- /discover feed can filter to just the topics he's actually working on.
-- Free-form text array (no enum) — niches evolve as Earth's content
-- focus shifts. The frontend keeps a curated suggestion list but does
-- not enforce it at the DB layer.
-- =====================================================================

alter table public.channels
  add column if not exists niches text[] not null default '{}'::text[];

-- GIN index so `channels.niches && array['solopreneur']` is indexed.
create index if not exists channels_niches_gin
  on public.channels using gin (niches);

comment on column public.channels.niches is
  'Free-form niche labels (e.g. solopreneur, ai-tech). Used by /discover filter.';
