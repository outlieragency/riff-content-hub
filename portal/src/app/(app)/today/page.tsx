import Link from 'next/link'
import {
  ArrowRight,
  Compass,
  Eye,
  Lightbulb,
  Pencil,
  Send,
  Sparkles,
  Tv,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FORMAT_META, type RecreateFormat } from '@/lib/types/recreate-formats'
import { getTutorialVideo } from '@/lib/actions/app-settings'
import {
  getDailyBrief,
  getWeeklyPostingStats,
} from '@/lib/actions/daily-brief'
import { TutorialCard } from '@/components/dashboard/tutorial-card'
import { DailyBrief } from '@/components/dashboard/daily-brief'
import { timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type DraftRow = {
  id: string
  format: string
  status: string
  title: string | null
  output: { cover_url?: string } | null
  updated_at: string
}

type IdeaRow = {
  id: string
  title: string
  thumbnail_url: string | null
  saved_at: string
  video_id: string | null
}

function startOfWeekIso(): string {
  const now = new Date()
  const day = now.getDay() // 0 sun ... 6 sat
  const diff = (day + 6) % 7 // monday = start
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const userName = user.email?.split('@')[0] ?? 'creator'
  const weekStart = startOfWeekIso()
  const todayStart = startOfTodayIso()

  // 9 queries fire in parallel
  const [
    { data: pendingRaw },
    { count: postedWeek },
    { count: postedToday },
    { data: ideasRaw },
    { count: channelCount },
    { count: totalDrafts },
    tutorial,
    briefVideos,
    weeklyStats,
  ] = await Promise.all([
    supabase
      .from('recreated_drafts')
      .select('id, format, status, title, output, updated_at')
      .eq('user_id', user.id)
      .in('status', ['ready', 'edited'])
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('recreated_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'published')
      .gte('updated_at', weekStart),
    supabase
      .from('recreated_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'published')
      .gte('updated_at', todayStart),
    supabase
      .from('ideas')
      .select('id, title, thumbnail_url, saved_at, video_id')
      .eq('user_id', user.id)
      .eq('status', 'idea')
      .order('saved_at', { ascending: false })
      .limit(5),
    supabase
      .from('channels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('recreated_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    getTutorialVideo(),
    getDailyBrief({ limit: 6 }),
    getWeeklyPostingStats(),
  ])
  const pending = (pendingRaw ?? []) as DraftRow[]
  const ideas = (ideasRaw ?? []) as IdeaRow[]

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif-display text-3xl text-foreground leading-tight">
            สวัสดี <span className="font-serif-italic">{userName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {weeklyStats.postedToday
              ? `วันนี้ลงไปแล้ว — ลุยวันพรุ่งนี้ต่อ`
              : pending.length === 0
                ? totalDrafts === 0
                  ? 'พร้อมเริ่ม content แรก? เลือก outlier ด้านล่างเลย'
                  : 'วันนี้ยังไม่ได้ลง — เลือก idea แล้ว recreate'
                : `มี ${pending.length} draft รอ review`}
          </p>
        </div>
        <WeeklyStreakBadge stats={weeklyStats} />
      </div>

      {/* Daily Brief — the morning ritual */}
      <DailyBrief videos={briefVideos} />

      <TutorialCard url={tutorial.url} title={tutorial.title} />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={Pencil}
          label="Drafts รอ review"
          value={pending.length}
          href="/recreated"
        />
        <StatCard
          icon={Send}
          label="Posted สัปดาห์นี้"
          value={postedWeek ?? 0}
          href="/recreated"
        />
        <StatCard
          icon={Lightbulb}
          label="Ideas รอลุย"
          value={ideas.length}
          href="/ideas"
        />
        <StatCard
          icon={Tv}
          label="Channels ติดตาม"
          value={channelCount ?? 0}
          href="/channels"
        />
      </div>

      {/* === Pending drafts (primary focus) === */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Drafts รอ review
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              คลิกเข้าไปดู cover + body แก้ไขก่อน push to Notion
            </p>
          </div>
          {pending.length > 0 && (
            <Link
              href="/recreated"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {pending.length === 0 ? (
          <EmptyTile
            icon={Pencil}
            title="ไม่มี draft รอ review"
            description="ลุย idea ใหม่ → AI สร้างให้ → มาเจอที่นี่"
            actionLabel="ไป Discover"
            actionHref="/discover"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pending.map((d) => (
              <PendingDraftCard key={d.id} draft={d} />
            ))}
          </div>
        )}
      </section>

      {/* === Recent ideas === */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Ideas ใหม่ที่ save ไว้
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              คลิกเพื่อ recreate
            </p>
          </div>
          {ideas.length > 0 && (
            <Link
              href="/ideas"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {ideas.length === 0 ? (
          <EmptyTile
            icon={Lightbulb}
            title="ยังไม่มี idea ใหม่"
            description="ไป Discover — save video ที่อยากเอามา recreate"
            actionLabel="ไป Discover"
            actionHref="/discover"
          />
        ) : (
          <ul className="surface-1 rounded-[14px] divide-y divide-border-soft">
            {ideas.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/ideas/${i.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors"
                >
                  {i.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.thumbnail_url}
                      alt=""
                      className="w-16 h-9 rounded-[6px] object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-9 rounded-[6px] bg-muted shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-foreground line-clamp-1">
                    {i.title}
                  </span>
                  <span className="text-2xs text-muted-foreground shrink-0">
                    {timeAgo(i.saved_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* === Quick links === */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          อื่น ๆ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            href="/discover"
            icon={Compass}
            title="Discover content"
            description="ดู video ทั้งหมดจากช่องที่ติดตาม + filter outlier"
          />
          <QuickLink
            href="/channels"
            icon={Tv}
            title="จัดการ Channels"
            description="เพิ่มช่อง YouTube ที่อยากตาม + sync ใหม่"
          />
          <QuickLink
            href="/voice"
            icon={Sparkles}
            title="Voice Profile"
            description="ปรับเสียงของคุณที่ AI ใช้ recreate"
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="surface-1 rounded-[14px] p-4 hover:bg-secondary/40 transition-colors block"
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        <Icon size={14} />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </div>
    </Link>
  )
}

function PendingDraftCard({ draft }: { draft: DraftRow }) {
  const meta = FORMAT_META[draft.format as RecreateFormat]
  const coverUrl = draft.output?.cover_url ?? null

  return (
    <Link
      href={`/recreated/${draft.id}`}
      className="surface-1 rounded-[12px] overflow-hidden hover:ring-2 hover:ring-brand transition-all block"
    >
      <div className="aspect-[4/5] bg-muted">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={draft.title ?? 'cover'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Eye size={20} />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta?.label ?? draft.format} · {timeAgo(draft.updated_at)}
        </div>
        <div className="text-xs font-medium text-foreground line-clamp-2 mt-0.5 leading-tight">
          {draft.title ?? 'Untitled'}
        </div>
      </div>
    </Link>
  )
}

function EmptyTile({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ComponentType<{ size?: number }>
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <div className="surface-1 rounded-[14px] p-6 text-center">
      <div className="inline-flex w-10 h-10 rounded-full bg-secondary items-center justify-center mb-3 text-muted-foreground">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
      >
        {actionLabel} <ArrowRight size={11} />
      </Link>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ size?: number }>
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="surface-1 rounded-[14px] p-4 hover:bg-secondary/40 transition-colors block"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-7 h-7 rounded-[7px] bg-brand-soft text-brand inline-flex items-center justify-center">
          <Icon size={14} />
        </span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Link>
  )
}

function WeeklyStreakBadge({
  stats,
}: {
  stats: { posted: number; target: number; postedToday: boolean }
}) {
  const dots = Array.from({ length: stats.target }).map((_, i) => i < stats.posted)
  return (
    <div className="surface-1 rounded-[12px] px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <div>
          <div className="text-2xs uppercase tracking-wider text-muted-foreground font-medium">
            อาทิตย์นี้
          </div>
          <div
            className="font-semibold text-foreground tabular-nums"
            style={{ fontSize: 18, lineHeight: 1.1, marginTop: 2 }}
          >
            {stats.posted}
            <span className="text-muted-foreground font-normal"> / {stats.target}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 ml-1.5">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-0.5">
              {dots.slice(row * 4, row * 4 + (row === 0 ? 4 : 3)).map((on, i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: on ? '#09321F' : 'rgba(26,36,24,0.12)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
