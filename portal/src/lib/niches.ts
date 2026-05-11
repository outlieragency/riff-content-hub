/**
 * Curated niche catalog for /discover filtering.
 *
 * Picked from Earth's actual content focus areas (Solopreneur, AI,
 * Marketing, Digital Product, etc). Free to extend — channels.niches
 * is text[] without an enum constraint, so adding a niche here doesn't
 * require a migration.
 *
 * `id` is the storage value (lowercase, dash-separated). `label` is the
 * display string.
 */

export type Niche = {
  id: string
  label: string
}

export const NICHES: Niche[] = [
  { id: 'solopreneur', label: 'Solopreneur' },
  { id: 'ai-tech', label: 'AI / Tech' },
  { id: 'marketing', label: 'Marketing / Sales' },
  { id: 'digital-product', label: 'Digital Product' },
  { id: 'self-dev', label: 'Self-development' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'business', label: 'Business / Entrepreneurship' },
  { id: 'creator-economy', label: 'Creator Economy' },
  { id: 'finance', label: 'Finance / Investing' },
  { id: 'coaching', label: 'Coaching / Consulting' },
]

const NICHE_BY_ID = new Map(NICHES.map((n) => [n.id, n]))

export function nicheLabel(id: string): string {
  return NICHE_BY_ID.get(id)?.label ?? id
}

export function isKnownNiche(id: string): boolean {
  return NICHE_BY_ID.has(id)
}
