'use client'

/**
 * Live HTML preview of the Headliner cover template.
 *
 * Renders the same visual as worker/templates/cover/trendtech-portrait.html.j2
 * but as React, so the user can:
 *   - Click any text to edit inline (contentEditable)
 *   - Drag the arrow to reposition
 *   - See font/color changes instantly without Playwright round-trip
 *
 * Save still goes through /cover/save (Playwright PNG) for the canonical
 * output. This is purely the editing surface.
 */

import { useEffect, useRef, useState } from 'react'
import type { FbArticleCover, LineStyle } from '@/lib/types/recreate-formats'

const CANVAS_W = 1080
const CANVAS_H = 1350
const TOP_H = 890
const BOTTOM_H = 460

type CoverLivePreviewProps = {
  cover: FbArticleCover
  /** When user edits/drags, this fires with the patched cover */
  onChange: (next: FbArticleCover) => void
  /** Source photo URL (YouTube thumbnail or uploaded override) */
  photoUrl: string | null
  /** Brand mark image data-URI (optional) */
  brandMarkUrl?: string | null
  /** Channel metadata for the badge */
  channelName?: string
  channelAvatarUrl?: string | null
  subscriberText?: string | null
  /** Theme colors from creative_style.renderer_config */
  theme?: {
    bg?: string
    fg?: string
    hl_red?: string
    hl_yellow?: string
    hl_orange?: string
  }
  /** Heading font (Google Fonts loaded by parent) */
  headingFont?: string
  bodyFont?: string
}

const DEFAULT_THEME = {
  bg: '#000000',
  fg: '#FFFFFF',
  hl_red: '#E53935',
  hl_yellow: '#FFD400',
  hl_orange: '#FF6B1A',
}

export function CoverLivePreview({
  cover,
  onChange,
  photoUrl,
  brandMarkUrl,
  channelName = '',
  channelAvatarUrl,
  subscriberText,
  theme,
  headingFont = 'Noto Sans Thai',
  bodyFont = 'Noto Sans Thai',
}: CoverLivePreviewProps) {
  const t = { ...DEFAULT_THEME, ...(theme ?? {}) }
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  const [draggingArrow, setDraggingArrow] = useState(false)
  const [arrowXY, setArrowXY] = useState<{ x: number; y: number } | null>(
    deriveArrowXY(cover.arrow_position),
  )

  // Auto-fit scale to container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const next = Math.min(1, w / CANVAS_W)
        setScale(next)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Sync arrowXY when cover.arrow_position changes externally
  useEffect(() => {
    setArrowXY(deriveArrowXY(cover.arrow_position))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cover.arrow_position])

  function patch(updates: Partial<FbArticleCover>) {
    onChange({ ...cover, ...updates })
  }

  function patchStyle(
    line: 'line1' | 'line2' | 'line3',
    update: Partial<LineStyle>,
  ) {
    const key = `${line}_style` as const
    const current = cover[key] ?? null
    const next: LineStyle = { ...(current ?? {}), ...update }
    patch({ [key]: next } as Partial<FbArticleCover>)
  }

  // ---- Arrow drag handlers ----
  function onArrowMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setDraggingArrow(true)
  }

  useEffect(() => {
    if (!draggingArrow) return
    function onMove(ev: MouseEvent) {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const localX = (ev.clientX - rect.left) / scale
      const localY = (ev.clientY - rect.top) / scale
      // Clamp inside top photo region with 30px padding
      const x = Math.max(30, Math.min(localX, CANVAS_W - 30))
      const y = Math.max(30, Math.min(localY, TOP_H - 30))
      setArrowXY({ x, y })
    }
    function onUp() {
      setDraggingArrow(false)
      // Snap to nearest preset zone, then save back to cover
      if (arrowXY) {
        const snapped = snapArrow(arrowXY.x, arrowXY.y)
        patch({ arrow_position: snapped })
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingArrow, scale, arrowXY])

  // ---- Text edit handler ----
  function onTextBlur(field: keyof FbArticleCover, el: HTMLElement) {
    const newValue = (el.innerText || '').trim()
    if (newValue === (cover[field] ?? '')) return
    patch({ [field]: newValue } as Partial<FbArticleCover>)
  }

  function lineFontSize(style: LineStyle | undefined): number {
    const pct = style?.font_size_pct
    if (typeof pct === 'number' && pct >= 50 && pct <= 150) {
      return 60 * (pct / 100)
    }
    return 60
  }

  function lineFontWeight(style: LineStyle | undefined): number {
    return style?.font_weight ?? 800
  }

  return (
    <div
      ref={containerRef}
      className="rm-cover-live-wrapper"
      style={{
        width: '100%',
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 6,
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* ===== Top: photo + overlays ===== */}
        <div
          style={{
            position: 'relative',
            width: CANVAS_W,
            height: TOP_H,
            background: '#0a0a0a',
            overflow: 'hidden',
          }}
        >
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%), linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Brand mark top-right */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              right: 32,
              width: 130,
              height: 130,
              filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
            }}
          >
            {brandMarkUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandMarkUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '50%',
                }}
              />
            )}
          </div>

          {/* Snap zone hints — visible only while dragging the arrow.
              Each box marks where the arrow will land if released over its
              quadrant. Without this the arrow appeared to "rubber-band" back
              to the same spot, since drag positions are quantized to 4 zones. */}
          {draggingArrow && <SnapZoneHints currentPosition={cover.arrow_position} />}

          {/* Arrow block — draggable */}
          <ArrowBlock
            top={cover.arrow_caption_top ?? ''}
            bottom={cover.arrow_caption_bottom ?? ''}
            x={arrowXY?.x ?? 60}
            y={arrowXY?.y ?? 600}
            highlightYellow={t.hl_yellow}
            bodyFont={bodyFont}
            onMouseDown={onArrowMouseDown}
            onTextBlur={onTextBlur}
            dragging={draggingArrow}
          />

          {/* Channel badge */}
          <div
            style={{
              position: 'absolute',
              right: 48,
              bottom: 80,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 22px 10px 10px',
              background: 'rgba(255,255,255,0.97)',
              borderRadius: 100,
              boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#ddd',
                flexShrink: 0,
              }}
            >
              {channelAvatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channelAvatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  color: '#111',
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: '-0.2px',
                }}
              >
                {channelName}
              </span>
              {subscriberText && (
                <span
                  style={{
                    color: '#555',
                    fontWeight: 400,
                    fontSize: 14,
                    marginTop: 3,
                  }}
                >
                  {subscriberText} subscribers
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== Bottom: black band with headline ===== */}
        <div
          style={{
            width: CANVAS_W,
            height: BOTTOM_H,
            background: t.bg,
            padding: '38px 56px 30px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <HeadlineLine
              text={cover.line1}
              highlight={cover.line1_highlight ?? ''}
              style={cover.line1_style}
              defaultHighlightTone="red"
              theme={t}
              headingFont={headingFont}
              bodyFont={bodyFont}
              fg={t.fg}
              fontSize={lineFontSize(cover.line1_style)}
              fontWeight={lineFontWeight(cover.line1_style)}
              onTextBlur={(el) => onTextBlur('line1', el)}
              onHighlightChange={(hl) => patch({ line1_highlight: hl })}
              onStyleChange={(s) => patchStyle('line1', s)}
            />
            <HeadlineLine
              text={cover.line2}
              highlight={cover.line2_highlight ?? ''}
              style={cover.line2_style}
              defaultHighlightTone="yellow"
              theme={t}
              headingFont={headingFont}
              bodyFont={bodyFont}
              fg={t.fg}
              fontSize={lineFontSize(cover.line2_style)}
              fontWeight={lineFontWeight(cover.line2_style)}
              onTextBlur={(el) => onTextBlur('line2', el)}
              onHighlightChange={(hl) => patch({ line2_highlight: hl })}
              onStyleChange={(s) => patchStyle('line2', s)}
            />
            <HeadlineLine
              text={cover.line3}
              highlight={cover.line3_highlight ?? ''}
              style={cover.line3_style}
              defaultHighlightTone="orange"
              theme={t}
              headingFont={headingFont}
              bodyFont={bodyFont}
              fg={t.fg}
              fontSize={lineFontSize(cover.line3_style)}
              fontWeight={lineFontWeight(cover.line3_style)}
              onTextBlur={(el) => onTextBlur('line3', el)}
              onHighlightChange={(hl) => patch({ line3_highlight: hl })}
              onStyleChange={(s) => patchStyle('line3', s)}
            />
          </div>
          {/* Subhead */}
          <EditableSubhead
            value={cover.subhead ?? ''}
            bodyFont={bodyFont}
            onBlur={(el) => onTextBlur('subhead', el)}
          />
        </div>
      </div>
    </div>
  )
}

/* ===== Sub-components ===== */

function HeadlineLine({
  text,
  highlight,
  style,
  defaultHighlightTone,
  theme,
  headingFont,
  fg,
  fontSize,
  fontWeight,
  onTextBlur,
  onHighlightChange,
  onStyleChange,
}: {
  text: string
  highlight: string
  style: LineStyle | null | undefined
  defaultHighlightTone: 'red' | 'yellow' | 'orange'
  theme: typeof DEFAULT_THEME
  headingFont: string
  bodyFont: string
  fg: string
  fontSize: number
  fontWeight: number
  onTextBlur: (el: HTMLElement) => void
  onHighlightChange: (newHighlight: string) => void
  onStyleChange: (s: Partial<LineStyle>) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)

  // Resolve highlight color
  const customColor = style?.highlight_color
  const customStyle = style?.highlight_style

  function renderTextWithHighlight() {
    if (!text) {
      return <span style={{ opacity: 0.45 }}>(พิมพ์บรรทัด...)</span>
    }
    if (!highlight || !text.includes(highlight)) {
      return text
    }
    const idx = text.indexOf(highlight)
    const before = text.slice(0, idx)
    const after = text.slice(idx + highlight.length)
    const tone = customColor
      ? customColor
      : defaultHighlightTone === 'red'
        ? theme.hl_red
        : defaultHighlightTone === 'yellow'
          ? theme.hl_yellow
          : theme.hl_orange
    const useBg =
      customStyle === 'background' ||
      (customStyle == null && defaultHighlightTone !== 'yellow')
    return (
      <>
        {before}
        <span
          style={
            useBg
              ? {
                  background: tone,
                  color: '#FFF',
                  padding: '2px 14px',
                  borderRadius: 6,
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone',
                }
              : { color: tone }
          }
        >
          {highlight}
        </span>
        {after}
      </>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setEditing(true)}
        onBlur={(e) => {
          setEditing(false)
          onTextBlur(e.currentTarget)
        }}
        style={{
          color: fg,
          fontWeight,
          fontSize,
          lineHeight: 1.35,
          letterSpacing: '-0.5px',
          fontFamily: `"${headingFont}", 'Noto Sans Thai', 'IBM Plex Sans Thai', sans-serif`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          outline: 'none',
          cursor: 'text',
          minHeight: fontSize * 1.35,
        }}
      >
        {editing ? text : renderTextWithHighlight()}
      </div>
      {/* Inline tools when focused: tone chip swatches + size buttons */}
      {!editing && text && (
        <div
          className="rm-line-tools"
          style={{
            position: 'absolute',
            top: -32,
            right: 0,
            display: 'flex',
            gap: 4,
            opacity: 0,
            transition: 'opacity .15s',
            pointerEvents: 'none',
          }}
        >
          <SizeButton
            current={style?.font_size_pct ?? 100}
            onChange={(pct) => onStyleChange({ font_size_pct: pct })}
          />
          <ToneSwatch
            color={theme.hl_red}
            label="red"
            active={customColor === theme.hl_red}
            onClick={() =>
              onStyleChange({
                highlight_color: theme.hl_red,
                highlight_style: 'background',
              })
            }
          />
          <ToneSwatch
            color={theme.hl_yellow}
            label="yellow"
            active={customColor === theme.hl_yellow}
            onClick={() =>
              onStyleChange({
                highlight_color: theme.hl_yellow,
                highlight_style: 'text-color',
              })
            }
          />
          <ToneSwatch
            color={theme.hl_orange}
            label="orange"
            active={customColor === theme.hl_orange}
            onClick={() =>
              onStyleChange({
                highlight_color: theme.hl_orange,
                highlight_style: 'background',
              })
            }
          />
        </div>
      )}
    </div>
  )
}

function SizeButton({
  current,
  onChange,
}: {
  current: number
  onChange: (pct: number) => void
}) {
  const sizes = [80, 100, 120]
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        background: 'rgba(0,0,0,0.7)',
        borderRadius: 4,
      }}
    >
      {sizes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          style={{
            background: current === s ? '#fff' : 'transparent',
            color: current === s ? '#000' : '#fff',
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 2,
            border: 0,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {s}%
        </button>
      ))}
    </div>
  )
}

function ToneSwatch({
  color,
  label,
  active,
  onClick,
}: {
  color: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        width: 22,
        height: 22,
        background: color,
        borderRadius: 4,
        border: active ? '2px solid #fff' : '1px solid rgba(255,255,255,0.4)',
        cursor: 'pointer',
        padding: 0,
      }}
    />
  )
}

function EditableSubhead({
  value,
  bodyFont,
  onBlur,
}: {
  value: string
  bodyFont: string
  onBlur: (el: HTMLElement) => void
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onBlur(e.currentTarget)}
      style={{
        color: 'rgba(255,255,255,0.78)',
        fontWeight: 400,
        fontStyle: 'italic',
        fontSize: 22,
        lineHeight: 1.35,
        letterSpacing: '0.1px',
        marginTop: 4,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        outline: 'none',
        cursor: 'text',
        fontFamily: `"${bodyFont}", 'Noto Sans Thai', sans-serif`,
        minHeight: 30,
      }}
    >
      {value || '(subhead...)'}
    </div>
  )
}

function ArrowBlock({
  top,
  bottom,
  x,
  y,
  highlightYellow,
  bodyFont,
  onMouseDown,
  onTextBlur,
  dragging,
}: {
  top: string
  bottom: string
  x: number
  y: number
  highlightYellow: string
  bodyFont: string
  onMouseDown: (e: React.MouseEvent) => void
  onTextBlur: (field: keyof FbArticleCover, el: HTMLElement) => void
  dragging: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          color: '#FFFFFF',
          fontFamily: `"${bodyFont}", 'Noto Sans Thai', sans-serif`,
          fontWeight: 600,
          fontSize: 32,
          lineHeight: 1.25,
          textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 16px rgba(0,0,0,0.6)',
          maxWidth: 560,
        }}
      >
        <span
          contentEditable
          suppressContentEditableWarning
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) => onTextBlur('arrow_caption_top', e.currentTarget)}
          style={{ outline: 'none', cursor: 'text' }}
        >
          {top || '(arrow top...)'}
        </span>
        <br />
        <span
          contentEditable
          suppressContentEditableWarning
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) => onTextBlur('arrow_caption_bottom', e.currentTarget)}
          style={{
            color: highlightYellow,
            fontWeight: 800,
            fontSize: 38,
            display: 'inline-block',
            marginTop: 4,
            outline: 'none',
            cursor: 'text',
          }}
        >
          {bottom || '(accent...)'}
        </span>
      </div>
      <svg
        onMouseDown={onMouseDown}
        viewBox="0 0 110 130"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: 110,
          height: 130,
          marginLeft: 30,
          transform: 'rotate(-8deg)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
        }}
      >
        <path
          d="M 8 8 Q 30 22, 40 50 T 70 90 Q 78 100, 90 108"
          fill="none"
          stroke="#000000"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 90 108 L 78 96 M 90 108 L 95 92"
          fill="none"
          stroke="#000000"
          strokeWidth={6}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function SnapZoneHints({ currentPosition }: { currentPosition: string | undefined }) {
  const zones: { key: string; label: string; x: number; y: number; w: number; h: number }[] = [
    { key: 'top-left',    label: 'มุมบนซ้าย',  x: 0,            y: 0,                w: CANVAS_W / 2, h: TOP_H / 3 },
    { key: 'left',        label: 'กลางซ้าย',   x: 0,            y: TOP_H / 3,        w: CANVAS_W / 2, h: TOP_H / 3 },
    { key: 'bottom-left', label: 'มุมล่างซ้าย', x: 0,            y: (TOP_H * 2) / 3,  w: CANVAS_W / 2, h: TOP_H / 3 },
    { key: 'right',       label: 'ฝั่งขวา',    x: CANVAS_W / 2, y: 0,                w: CANVAS_W / 2, h: TOP_H },
  ]
  return (
    <>
      {zones.map((z) => (
        <div
          key={z.key}
          style={{
            position: 'absolute',
            left: z.x,
            top: z.y,
            width: z.w,
            height: z.h,
            border: '3px dashed rgba(255,255,255,0.55)',
            background:
              currentPosition === z.key
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
            zIndex: 3,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: 14,
          }}
        >
          <span
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: 22,
              padding: '6px 14px',
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            {z.label}
          </span>
        </div>
      ))}
    </>
  )
}

/* ===== Helpers ===== */

function deriveArrowXY(position: string | undefined): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: 50, y: 60 }
    case 'left':
      return { x: 60, y: 380 }
    case 'right':
      return { x: 700, y: 360 }
    case 'bottom-left':
    default:
      return { x: 60, y: 600 }
  }
}

function snapArrow(x: number, y: number): string {
  // Quadrant snap: left-half vs right-half × top-third vs bottom-half
  const isLeft = x < CANVAS_W / 2
  const isTop = y < TOP_H / 3
  const isMid = y >= TOP_H / 3 && y < (TOP_H * 2) / 3
  if (isLeft && isTop) return 'top-left'
  if (isLeft && isMid) return 'left'
  if (!isLeft) return 'right'
  return 'bottom-left'
}
