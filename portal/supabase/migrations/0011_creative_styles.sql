-- 0011_creative_styles.sql
-- Creative Style Profile system — visual equivalent of voice_profiles.
--
-- User uploads reference images → Claude Vision extracts a style guide →
-- AI uses style_guide_md when generating cover/carousel + renderer_config
-- maps style to one of N base templates (Headliner, Minimal, Bold-quote, …).
--
-- Symmetric with voice_profiles:
--   voice_profiles  → applied to text (post body, headline)
--   creative_styles → applied to image (cover, carousel slides)

-- =========================================================
-- creative_styles
-- =========================================================
create table if not exists public.creative_styles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  format_type text not null,
    -- 'cover' (FB single-image), 'carousel' (multi-slide), 'thumbnail' (YouTube), 'reel' (vertical)
    -- check is enforced at app layer to keep flexibility for future formats

  -- Reference images Earth uploaded (public URLs from storage bucket creative-styles)
  -- shape: [{url, caption?, uploaded_at}, ...]
  reference_images jsonb not null default '[]'::jsonb,

  -- Markdown style guide (AI-extracted then user-editable). Same role as
  -- earth-rati-fb-style.md but for visual style.
  style_guide_md text not null default '',

  -- How to render this style:
  --   {
  --     base_template: 'headliner' | 'minimal-card' | 'bold-quote' | 'thread-x' | ...,
  --     theme: { bg, fg, accent, hl_red, hl_yellow, hl_orange, ... },
  --     fonts: { heading, body },
  --     layout_overrides: {...}
  --   }
  renderer_config jsonb not null default '{}'::jsonb,

  -- Only one default style per (user, format_type)
  is_default boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index creative_styles_user_format_idx
  on public.creative_styles(user_id, format_type);

create unique index creative_styles_default_unique
  on public.creative_styles(user_id, format_type)
  where is_default = true;

-- =========================================================
-- recreated_drafts: link to creative_style (nullable for backward compat)
-- =========================================================
alter table public.recreated_drafts
  add column if not exists creative_style_id uuid references public.creative_styles(id) on delete set null;

create index if not exists recreated_drafts_style_idx
  on public.recreated_drafts(creative_style_id);

-- =========================================================
-- RLS
-- =========================================================
alter table public.creative_styles enable row level security;

create policy "creative_styles owner select"
on public.creative_styles for select
to authenticated
using (auth.uid() = user_id);

create policy "creative_styles owner insert"
on public.creative_styles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "creative_styles owner update"
on public.creative_styles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "creative_styles owner delete"
on public.creative_styles for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- updated_at trigger
-- =========================================================
create trigger creative_styles_updated_at
  before update on public.creative_styles
  for each row execute function public.set_updated_at();

-- =========================================================
-- Storage bucket: creative-styles
-- Path convention: creative-styles/{user_id}/{style_id}/ref-{n}.png
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creative-styles',
  'creative-styles',
  true,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "creative-styles public read" on storage.objects;
drop policy if exists "creative-styles owner upload" on storage.objects;
drop policy if exists "creative-styles owner update" on storage.objects;
drop policy if exists "creative-styles owner delete" on storage.objects;

create policy "creative-styles public read"
on storage.objects for select
to public
using (bucket_id = 'creative-styles');

create policy "creative-styles owner upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'creative-styles'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "creative-styles owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'creative-styles'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'creative-styles'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "creative-styles owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'creative-styles'
  and (storage.foldername(name))[1] = auth.uid()::text
);
