/**
 * AI Action Preset tool types — extracted from lib/actions/tools.ts so they can
 * be imported by client components without dragging in the 'use server' module.
 *
 * Next.js 15+ rule: a "use server" file can only export async functions; types
 * declared there cause a server-action boundary error at runtime when client
 * code imports them.
 */

export type ToolKind =
  | 'hook_doctor'
  | 'grade_draft'
  | 'niche_playbook'
  | 'voice_rewrite'

export type RunToolResult =
  | {
      ok: true
      output_markdown: string
      meta: {
        model: string
        latency_ms: number
        cache_hit_ratio: number
      }
    }
  | { ok: false; error: string }
