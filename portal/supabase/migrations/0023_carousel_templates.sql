-- =====================================================================
-- 0023: carousel_templates — user-uploaded carousel slide templates
--
-- Earth uploads a screenshot of a carousel slide he likes →
-- Claude vision parses it into a Jinja2 HTML template + JSON schema
-- of editable fields + a default theme. The template is then reusable
-- across all carousel generations (one template = N slides with the
-- same layout but different content).
--
-- This is the visual analogue of `user_prompts` — instead of editing
-- the text-generation prompt, you edit the visual rendering template.
-- =====================================================================

create table if not exists public.carousel_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  description text,

  -- Storage paths in `carousel-templates` bucket
  source_image_path text,        -- original screenshot user uploaded
  thumbnail_path text,           -- rendered preview (1080×1350 PNG)

  -- Jinja2 HTML template. Must include a 1080×1350 wrapper.
  -- Editable text uses {{ field_key }} placeholders that match `schema`.
  html_template text not null,

  -- Editable fields the live-edit UI will render. Shape:
  -- [
  --   {
  --     "key": "heading",
  --     "type": "text" | "longtext",
  --     "label": "Heading",
  --     "default": "Default text",
  --     "max_chars": 80
  --   },
  --   ...
  -- ]
  schema jsonb not null default '[]'::jsonb,

  -- Default theme — colors + fonts. UI lets user override per-slide.
  -- Shape: { bg, fg, accent, font_heading, font_body }
  default_theme jsonb not null default '{}'::jsonb,

  -- Canvas dimensions. Default IG 4:5 portrait (matches existing
  -- thread-x). User cannot change after creation — keeps rendering
  -- predictable.
  width int not null default 1080,
  height int not null default 1350,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carousel_templates_user_idx
  on public.carousel_templates(user_id);

create index if not exists carousel_templates_active_idx
  on public.carousel_templates(user_id, is_active)
  where is_active;

-- ---------------------------------------------------------------------
-- RLS — owner only
-- ---------------------------------------------------------------------
alter table public.carousel_templates enable row level security;

drop policy if exists "carousel_templates owner select" on public.carousel_templates;
drop policy if exists "carousel_templates owner insert" on public.carousel_templates;
drop policy if exists "carousel_templates owner update" on public.carousel_templates;
drop policy if exists "carousel_templates owner delete" on public.carousel_templates;

create policy "carousel_templates owner select"
  on public.carousel_templates for select
  to authenticated
  using (auth.uid() = user_id);

create policy "carousel_templates owner insert"
  on public.carousel_templates for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "carousel_templates owner update"
  on public.carousel_templates for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "carousel_templates owner delete"
  on public.carousel_templates for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
drop trigger if exists carousel_templates_updated_at on public.carousel_templates;
create trigger carousel_templates_updated_at
  before update on public.carousel_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Storage bucket: carousel-templates
-- Path: carousel-templates/{user_id}/{template_id}/{kind}.png
--   where kind = 'source' | 'thumbnail'
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'carousel-templates',
  'carousel-templates',
  true,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "carousel-templates public read" on storage.objects;
drop policy if exists "carousel-templates owner upload" on storage.objects;
drop policy if exists "carousel-templates owner update" on storage.objects;
drop policy if exists "carousel-templates owner delete" on storage.objects;

create policy "carousel-templates public read"
  on storage.objects for select
  to public
  using (bucket_id = 'carousel-templates');

create policy "carousel-templates owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'carousel-templates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "carousel-templates owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'carousel-templates'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'carousel-templates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "carousel-templates owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'carousel-templates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.carousel_templates is
  'User-uploaded carousel templates. Screenshot → Claude vision parse → Jinja2 HTML + JSON schema. Used by /carousel-templates UI and the carousel recreate pipeline.';
