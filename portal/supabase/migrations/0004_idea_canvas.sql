-- 0004_idea_canvas.sql
-- เพิ่ม Eden-style canvas position สำหรับ idea cards
-- ลากวางได้ใน /ideas?view=canvas

alter table public.ideas
  add column if not exists canvas_x numeric,
  add column if not exists canvas_y numeric,
  add column if not exists canvas_color text;  -- nullable: 'amber' | 'green' | 'blue' | 'pink' | 'purple' | null

-- Index for canvas view queries (where canvas_x is not null)
create index if not exists ideas_canvas_idx on public.ideas(user_id) where canvas_x is not null;

comment on column public.ideas.canvas_x is 'x coordinate on Idea Canvas (logical units, not pixels). null = not placed';
comment on column public.ideas.canvas_y is 'y coordinate on Idea Canvas';
comment on column public.ideas.canvas_color is 'optional grouping color: amber | green | blue | pink | purple';
