/**
 * Curated catalog of top YouTube creators per niche.
 *
 * Used by /discover's "Suggested creators in [niche]" row to surface
 * channels Earth doesn't track yet — so the feed stops recycling the
 * same creators and pulls in fresh outlier signal.
 *
 * All handles below were verified on 2026-05-11 via YouTube Data API.
 * Each resolves to a channel with at least 100K subscribers and the
 * matching display name. When adding a new creator:
 *   1. Resolve the handle via the API first (or `worker/services/youtube/api.py`)
 *   2. Verify subs >= 100K and the title matches the real creator
 *   3. Add to BOTH this file AND `worker/.../shared_pool_sync.py::CURATED_BY_NICHE`
 */

export type NicheCreators = {
  /** YouTube handle without the leading `@`. Lower-case; YT resolution is case-insensitive. */
  handle: string
  /** Short hint shown on hover */
  hint?: string
}

export const NICHE_CREATORS: Record<string, NicheCreators[]> = {
  solopreneur: [
    { handle: 'alexhormozi', hint: '$100M offer + 1-person scaling' },
    { handle: 'thedankoe', hint: '1-person creator business' },
    { handle: 'gregisenberg', hint: 'Startup ideas, indie hackers' },
    { handle: 'patflynn', hint: 'Smart passive income, solo creator' },
  ],
  'ai-tech': [
    { handle: 'mreflow', hint: 'AI tools for marketers (Matt Wolfe)' },
    { handle: 'wesroth', hint: 'AI research breakdowns' },
    { handle: 'mattvidpro', hint: 'AI video / tool reviews' },
    { handle: 'theaigrid', hint: 'AI updates + analysis' },
  ],
  marketing: [
    { handle: 'imangadzhi', hint: 'Agency growth' },
    { handle: 'alexhormozi', hint: 'Offers, sales' },
    { handle: 'andrewkirby_', hint: 'Marketing breakdowns' },
    { handle: 'thedankoe', hint: 'Writing + audience' },
    { handle: 'garyvee', hint: 'Brand + marketing' },
  ],
  'digital-product': [
    { handle: 'noahkagan', hint: 'AppSumo, $1M challenges' },
    { handle: 'aliabdaal', hint: 'Course / online education' },
    { handle: 'patflynn', hint: 'Course + membership business' },
  ],
  'self-dev': [
    { handle: 'thedankoe', hint: 'Stoicism + entrepreneurship' },
    { handle: 'aliabdaal', hint: 'Productivity + learning' },
    { handle: 'chriswillx', hint: 'Long-form mindset' },
    { handle: 'hubermanlab', hint: 'Science-backed protocols' },
    { handle: 'lewishowes', hint: 'School of Greatness' },
  ],
  productivity: [
    { handle: 'aliabdaal', hint: 'Notion, deep work' },
    { handle: 'thomasfrank', hint: 'Notion + study systems' },
    { handle: 'tiagoforte', hint: 'Second brain / PARA' },
    { handle: 'augustbradley', hint: 'Notion advanced' },
  ],
  business: [
    { handle: 'alexhormozi', hint: 'Scaling 1→100' },
    { handle: 'codiesanchezct', hint: 'Buying / boring biz' },
    { handle: 'gregisenberg', hint: 'Startup ideas weekly' },
    { handle: 'shaanpuri', hint: 'My First Million — biz ideas' },
    { handle: 'leilahormozi', hint: 'Acquisition Pro / scaling ops' },
  ],
  'creator-economy': [
    { handle: 'gregisenberg', hint: 'Creator businesses' },
    { handle: 'colinandsamir', hint: 'Creator interviews' },
    { handle: 'thedankoe', hint: '1-person brand' },
    { handle: 'thefutur', hint: 'Creative business + design' },
  ],
  finance: [
    { handle: 'grahamstephan', hint: 'Real estate + investing' },
    { handle: 'humphreyyang', hint: 'Personal finance' },
    { handle: 'andreijikh', hint: 'Stock market deep dives' },
  ],
  coaching: [
    { handle: 'alexhormozi', hint: 'Coaching offer mechanics' },
    { handle: 'leilahormozi', hint: 'Coaching → enterprise scaling' },
    { handle: 'sambailey', hint: 'Coaching scaling' },
    { handle: 'marieforleo', hint: 'Coaching + content business' },
  ],
}

/** Top creators across all picked niches, deduped, with their first niche tag. */
export function getSuggestedCreators(
  nicheIds: string[],
): { handle: string; niche: string; hint?: string }[] {
  const seen = new Set<string>()
  const out: { handle: string; niche: string; hint?: string }[] = []
  for (const niche of nicheIds) {
    for (const c of NICHE_CREATORS[niche] ?? []) {
      if (seen.has(c.handle)) continue
      seen.add(c.handle)
      out.push({ handle: c.handle, niche, hint: c.hint })
    }
  }
  return out
}
