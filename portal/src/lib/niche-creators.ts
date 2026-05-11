/**
 * Curated catalog of top YouTube creators per niche.
 *
 * Used by /discover's "Suggested creators in [niche]" row to surface
 * channels Earth doesn't track yet — so the feed stops recycling the
 * same creators and pulls in fresh outlier signal.
 *
 * Picked from creators that consistently produce high-outlier content
 * in EN. Append-only: never remove an entry unless a handle is
 * permanently dead (channel deleted, banned, etc).
 */

export type NicheCreators = {
  /** YouTube handle without the leading `@` */
  handle: string
  /** Short hint shown on hover */
  hint?: string
}

export const NICHE_CREATORS: Record<string, NicheCreators[]> = {
  solopreneur: [
    { handle: 'hormozi', hint: '$100M offer, 1-person scaling' },
    { handle: 'thedankoe', hint: '1-person creator business' },
    { handle: 'thejustinwelsh', hint: 'Solopreneur frameworks' },
    { handle: 'codiesanchez', hint: 'Boring biz / contrarian thinking' },
    { handle: 'gregisenberg', hint: 'Startup ideas, indie hackers' },
  ],
  'ai-tech': [
    { handle: 'mreflow', hint: 'AI tools for marketers' },
    { handle: 'aisearchio', hint: 'AI news + tool reviews' },
    { handle: 'wesroth', hint: 'AI research breakdowns' },
    { handle: 'mattvidpro', hint: 'AI video / tools' },
    { handle: 'theaigrid', hint: 'AI updates + analysis' },
  ],
  marketing: [
    { handle: 'imangadzhi', hint: 'Agency growth' },
    { handle: 'hormozi', hint: 'Offers, sales' },
    { handle: 'andrewkirby', hint: 'Marketing breakdowns' },
    { handle: 'thedankoe', hint: 'Writing + audience' },
    { handle: 'jaymezzy', hint: 'Funnels' },
  ],
  'digital-product': [
    { handle: 'noahkagan', hint: 'AppSumo, $1M challenges' },
    { handle: 'thejustinwelsh', hint: 'Solo digital products' },
    { handle: 'roblennon', hint: 'Writing → digital products' },
    { handle: 'aliabdaal', hint: 'Course / online education' },
  ],
  'self-dev': [
    { handle: 'thedankoe', hint: 'Stoicism + entrepreneurship' },
    { handle: 'aliabdaal', hint: 'Productivity + learning' },
    { handle: 'chriswillx', hint: 'Long-form mindset' },
    { handle: 'hubermanlab', hint: 'Science-backed protocols' },
  ],
  productivity: [
    { handle: 'aliabdaal', hint: 'Notion, deep work' },
    { handle: 'thomasfrank', hint: 'Notion + study systems' },
    { handle: 'tiagoforte', hint: 'Second brain / PARA' },
    { handle: 'augustbradley', hint: 'Notion advanced' },
  ],
  business: [
    { handle: 'hormozi', hint: 'Scaling 1→100' },
    { handle: 'codiesanchez', hint: 'Buying / boring biz' },
    { handle: 'gregisenberg', hint: 'Startup ideas weekly' },
    { handle: 'mybenshapiro', hint: 'Sales + biz tactical' },
  ],
  'creator-economy': [
    { handle: 'gregisenberg', hint: 'Creator businesses' },
    { handle: 'colinandsamir', hint: 'Creator interviews' },
    { handle: 'thedankoe', hint: '1-person brand' },
    { handle: 'thejustinwelsh', hint: 'Solo creator income' },
  ],
  finance: [
    { handle: 'grahamstephan', hint: 'Real estate + investing' },
    { handle: 'humphreytalks', hint: 'Personal finance' },
    { handle: 'andreijikh', hint: 'Stock market deep dives' },
    { handle: 'thoughtsmoney', hint: 'Money frameworks' },
  ],
  coaching: [
    { handle: 'hormozi', hint: 'Coaching offer mechanics' },
    { handle: 'codiesanchez', hint: 'Consulting → income' },
    { handle: 'mybenshapiro', hint: 'Coaching sales' },
    { handle: 'sambailey', hint: 'Coaching scaling' },
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
