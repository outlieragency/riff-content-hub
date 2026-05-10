/**
 * Outlier score color band system
 *
 * score = video.view_count / channel.channel_avg_views
 * channel_avg_views = MEDIAN ของ 30 long-form video ล่าสุด, exclude Shorts
 *
 * ห้ามเปลี่ยนสูตรเป็น mean เพราะ single viral video drag baseline ขึ้น
 * ทำให้ outlier จริงดูไม่ outlier
 */

export type OutlierBand = 'below' | 'average' | 'outlier' | 'viral' | 'mega'

export type BandConfig = {
  label: string
  bg: string
  text: string
  border: string
}

export function bandFor(score: number | null | undefined): OutlierBand | null {
  if (score == null) return null
  if (score < 1) return 'below'
  if (score < 2) return 'average'
  if (score < 5) return 'outlier'
  if (score < 10) return 'viral'
  return 'mega'
}

export const BAND_CONFIG: Record<OutlierBand, BandConfig> = {
  below: {
    label: 'below avg',
    bg: 'bg-secondary',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  average: {
    label: 'average',
    bg: 'bg-status-blue-bg',
    text: 'text-status-blue-text',
    border: 'border-status-blue-border',
  },
  outlier: {
    label: 'outlier',
    bg: 'bg-status-green-bg',
    text: 'text-status-green-text',
    border: 'border-status-green-border',
  },
  viral: {
    label: 'viral',
    bg: 'bg-status-orange-bg',
    text: 'text-status-orange-text',
    border: 'border-status-orange-border',
  },
  mega: {
    label: 'mega viral',
    bg: 'bg-status-red-bg',
    text: 'text-status-red-text',
    border: 'border-status-red-border',
  },
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return ''
  return `${score.toFixed(1)}x`
}
