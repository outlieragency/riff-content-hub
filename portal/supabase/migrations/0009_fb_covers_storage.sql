-- 0009_fb_covers_storage.sql
-- Storage bucket + RLS for FB content cover images
-- Path convention: fb-covers/{user_id}/{draft_id}/{cover|cover-photo}.png
--
-- เก็บ:
--   cover-photo.png (optional, user-supplied source ที่ Pillow ใช้แทน YouTube thumbnail)
--   cover.png       (final rendered output)
--
-- Public read = ภาพ cover แสดงใน portal preview ได้ทันที (no signed URL needed)
-- Write = เฉพาะ owner ของ folder {user_id}

-- =========================================================
-- Bucket
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fb-covers',
  'fb-covers',
  true,                                 -- public read
  10 * 1024 * 1024,                     -- 10MB max per file
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =========================================================
-- RLS — owner can read/write their own folder; everyone can read public
-- =========================================================
-- Drop existing policies if re-running (idempotent migration)
drop policy if exists "fb-covers public read" on storage.objects;
drop policy if exists "fb-covers owner upload" on storage.objects;
drop policy if exists "fb-covers owner update" on storage.objects;
drop policy if exists "fb-covers owner delete" on storage.objects;

-- Public read (bucket is public, but be explicit)
create policy "fb-covers public read"
on storage.objects for select
to public
using (bucket_id = 'fb-covers');

-- Owner upload (path must start with their user_id)
create policy "fb-covers owner upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'fb-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "fb-covers owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'fb-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'fb-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "fb-covers owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'fb-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- =========================================================
-- Comment
-- =========================================================
comment on table storage.buckets is
  'Riff storage buckets. fb-covers = FB content workflow (cover-photo.png + cover.png) per draft';
