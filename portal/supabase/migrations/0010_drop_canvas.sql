-- 0010_drop_canvas.sql
-- Drops Idea Canvas feature (introduced in 0004) — feature provided no semantic
-- value beyond decoration; user (Earth) flagged as noise during pre-deploy QA.
--
-- Removes:
--   - ideas.canvas_x (numeric)
--   - ideas.canvas_y (numeric)
--   - ideas.canvas_color (text)
--   - ideas_canvas_idx (partial index on user_id where canvas_x is not null)

drop index if exists public.ideas_canvas_idx;

alter table public.ideas
  drop column if exists canvas_x,
  drop column if exists canvas_y,
  drop column if exists canvas_color;
