'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  LayoutGrid,
  Loader2,
  Smartphone,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { deleteRecreatedDraft } from '@/lib/actions/recreate'
import {
  FORMAT_META,
  type RecreateFormat,
} from '@/lib/types/recreate-formats'
import { timeAgo } from '@/lib/utils'

const ICON_MAP = {
  video: Video,
  'file-text': FileText,
  smartphone: Smartphone,
  'layout-grid': LayoutGrid,
} as const

const STATUS_STYLE: Record<
  string,
  { label: string; className: string }
> = {
  queued: { label: 'รอคิว', className: 'bg-muted text-muted-foreground' },
  generating: {
    label: 'กำลังสร้าง',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  ready: {
    label: 'พร้อม',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  edited: {
    label: 'แก้แล้ว',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  published: {
    label: 'Posted',
    className: 'bg-emerald-600 text-white',
  },
  error: {
    label: 'Error',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
}

export type RecreatedCardData = {
  id: string
  format: RecreateFormat
  status: string
  title: string | null
  cover_url: string | null
  channel_title: string | null
  source_video_title: string | null
  updated_at: string
  error: string | null
}

export function RecreatedCard({ data }: { data: RecreatedCardData }) {
  const [pending, start] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const meta = FORMAT_META[data.format]
  const Icon = (meta && ICON_MAP[meta.icon as keyof typeof ICON_MAP]) ?? Sparkles
  const statusStyle = STATUS_STYLE[data.status] ?? STATUS_STYLE.ready

  const onDelete = () => {
    start(async () => {
      const res = await deleteRecreatedDraft(data.id)
      if (!res.ok) {
        alert(res.error)
      }
    })
  }

  return (
    <div className="group relative">
      <Link
        href={`/recreated/${data.id}`}
        className="block surface-1 rounded-[14px] overflow-hidden hover:ring-2 hover:ring-brand transition-all"
      >
        {/* Cover preview */}
        <div className="relative aspect-[4/5] bg-muted overflow-hidden">
          {data.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.cover_url}
              alt={data.title ?? 'cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Icon size={32} />
            </div>
          )}

          {/* Status pill — top-right */}
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.className}`}
            >
              {data.status === 'published' && <CheckCircle2 size={10} />}
              {data.status === 'generating' && (
                <Loader2 className="animate-spin" size={10} />
              )}
              {statusStyle.label}
            </span>
          </div>

          {/* Format badge — top-left */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur">
              <Icon size={10} />
              {meta?.label ?? data.format}
            </span>
          </div>
        </div>

        {/* Title + meta */}
        <div className="p-3 space-y-1">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight min-h-[2.6em]">
            {data.title ?? 'Untitled'}
          </h3>
          {data.channel_title && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <ExternalLink size={10} />
              <span className="truncate">{data.channel_title}</span>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={9} />
            {timeAgo(data.updated_at)}
          </div>
          {data.error && (
            <div className="text-[10px] text-red-700 line-clamp-1">
              ! {data.error}
            </div>
          )}
        </div>
      </Link>

      {/* Delete button — appears on hover, bottom-right over cover */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setConfirmOpen(true)
        }}
        disabled={pending}
        aria-label="Delete draft"
        title="ลบ draft"
        className="absolute bottom-[120px] right-2 z-10 p-2 rounded-full bg-black/70 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
      >
        <Trash2 size={14} />
      </button>

      {/* Confirm delete dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <div
            className="bg-card rounded-[14px] p-5 w-[380px] max-w-[92vw] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                ลบ draft นี้?
              </h3>
              {!pending && (
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {data.title ?? 'Untitled draft'}
              <br />
              <span className="text-xs">
                ลบทั้ง draft + cover.png + override (ถ้ามี) ไม่สามารถกู้คืนได้
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-[8px]"
              >
                ยกเลิก
              </button>
              <button
                onClick={onDelete}
                disabled={pending}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    ลบ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

