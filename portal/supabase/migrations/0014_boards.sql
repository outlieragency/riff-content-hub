-- 0014_boards.sql
-- Boards / Collections — user-labeled folders for ideas (Eden swipe file pattern)
--
-- Many-to-many: 1 idea can be in 0..N boards. Default = "All ideas" virtual board
-- (no row needed — fallback when board_id filter is null).
--
-- Phase 1: per-user boards. Phase 2: shared/team boards via workspace_id FK.

-- =========================================================
-- boards
-- =========================================================
create table if not exists public.boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  -- Soft accent color hex. UI uses for chip background.
  -- 'orange' | 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate'
  color text not null default 'slate',
  -- 1-2 emoji icon for visual scan
  icon text,

  -- User-controlled order in sidebar (lower = higher in list)
  sort_order int not null default 0,
  -- Pinned to top of sidebar
  is_pinned boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_user_idx on public.boards(user_id);
create index if not exists boards_user_sort_idx on public.boards(user_id, sort_order);

-- =========================================================
-- board_ideas — junction table
-- =========================================================
create table if not exists public.board_ideas (
  board_id uuid not null references public.boards(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  -- Denormalize user_id for RLS check (avoid join)
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),

  primary key (board_id, idea_id)
);

create index if not exists board_ideas_idea_idx on public.board_ideas(idea_id);
create index if not exists board_ideas_user_idx on public.board_ideas(user_id);

-- =========================================================
-- RLS
-- =========================================================
alter table public.boards enable row level security;
alter table public.board_ideas enable row level security;

drop policy if exists "boards owner all" on public.boards;
create policy "boards owner all"
on public.boards for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "board_ideas owner all" on public.board_ideas;
create policy "board_ideas owner all"
on public.board_ideas for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================
-- updated_at trigger on boards
-- =========================================================
drop trigger if exists boards_updated_at on public.boards;
create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();
