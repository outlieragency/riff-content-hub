'use client'

import { useState } from 'react'
import { Play, X, Video } from 'lucide-react'

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/

function extractYouTubeId(url: string): string | null {
  const m = url.match(YT_RE)
  return m ? m[1] : null
}

export function TutorialCard({
  url,
  title,
}: {
  url: string | null
  title: string | null
}) {
  const [open, setOpen] = useState(false)
  const ytId = url ? extractYouTubeId(url) : null
  const thumbnail = ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : null
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
    : url ?? ''

  // Placeholder card when no URL set yet (Earth records video later)
  if (!url) {
    return (
      <div
        className="surface-1 w-full rounded-[14px] mb-8 overflow-hidden"
      >
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: '180px 1fr' }}
        >
          <div
            className="bg-secondary flex items-center justify-center"
            style={{ aspectRatio: '16 / 9' }}
          >
            <Video size={28} className="text-muted-foreground" />
          </div>
          <div className="p-4 flex flex-col justify-center">
            <div className="text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
              วิดีโอแนะนำการใช้งาน
            </div>
            <div className="text-base font-semibold text-foreground leading-snug">
              เร็ว ๆ นี้
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              เดี๋ยว Earth จะอัดวิดีโอแนะนำการใช้งาน Riff ใน 1 นาที มาแปะให้ดูที่นี่
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="surface-1 w-full rounded-[14px] mb-8 overflow-hidden block group cursor-pointer text-left transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(26,36,24,0.18)]"
      >
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: '180px 1fr' }}
        >
          <div className="relative bg-secondary" style={{ aspectRatio: '16 / 9' }}>
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = ytId
                    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                    : ''
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Play size={28} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="inline-flex items-center justify-center rounded-full bg-black/60 group-hover:bg-black/75 transition-colors"
                style={{ width: 44, height: 44 }}
              >
                <Play
                  size={18}
                  fill="white"
                  strokeWidth={0}
                  className="text-white ml-0.5"
                />
              </span>
            </div>
          </div>

          <div className="p-4 flex flex-col justify-center">
            <div className="text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
              วิดีโอแนะนำการใช้งาน
            </div>
            <div className="text-base font-semibold text-foreground leading-snug">
              {title || 'แนะนำการใช้งาน Riff'}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              ดูภาพรวมของ Riff ใน 1 นาทีก่อนเริ่มลุย
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-[920px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <div
              className="rounded-[14px] overflow-hidden bg-black"
              style={{ aspectRatio: '16 / 9' }}
            >
              {ytId ? (
                <iframe
                  src={embedUrl}
                  title={title || 'Tutorial'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ border: 0 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    เปิดวิดีโอในแท็บใหม่
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
