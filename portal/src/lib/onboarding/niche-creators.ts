/**
 * Curated map of interest tag → top YouTube creators in that niche.
 *
 * When user picks interests during onboarding, Riff auto-syncs these
 * channels for them — no manual add-channel step required.
 *
 * Picked from creators that consistently produce high-outlier content
 * in EN. Thai creators will be added in a separate map once we
 * benchmark Thai outlier patterns.
 *
 * Update strategy: append-only when a new niche-leader emerges.
 * Remove only if a handle is permanently dead.
 */

export const NICHE_CREATORS: Record<string, string[]> = {
  business: ['hormozi', 'codiesanchez', 'gregisenberg', 'mreflow'],
  marketing: ['hormozi', 'thejustinwelsh', 'imangadzhi', 'thedankoe'],
  finance: ['grahamstephan', 'humphreytalks', 'andreijikh'],
  investing: ['grahamstephan', 'thoughtsmoney', 'andreijikh'],
  productivity: ['aliabdaal', 'thomasfrank', 'tiagoforte'],
  'self-dev': ['thedankoe', 'aliabdaal', 'chriswillx'],
  'ai-tech': ['mreflow', 'aisearchio', 'wesroth'],
  'creator-economy': ['gregisenberg', 'colinandsamir', 'thedankoe'],
  'digital-product': ['noahkagan', 'thejustinwelsh', 'roblennon'],
  coaching: ['hormozi', 'codiesanchez', 'mybenshapiro'],
  philosophy: ['naval', 'hubermanlab', 'thedankoe'],
  health: ['hubermanlab', 'docsamhulick'],
  career: ['thejustinwelsh', 'aliabdaal', 'codiesanchez'],
  education: ['aliabdaal', 'thomasfrank', 'JustinSung'],
  'real-estate': ['grahamstephan', 'graham'],
  lifestyle: ['aliabdaal', 'thedankoe', 'chriswillx'],
}

/** Resolve a deduped list of channel handles for the given interests. */
export function resolveCreatorsForInterests(interests: string[]): string[] {
  const seen = new Set<string>()
  for (const tag of interests) {
    const handles = NICHE_CREATORS[tag]
    if (!handles) continue
    for (const h of handles) seen.add(h)
  }
  return Array.from(seen)
}
