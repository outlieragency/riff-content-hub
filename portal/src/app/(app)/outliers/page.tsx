import { permanentRedirect } from 'next/navigation'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Legacy /outliers route — preserved for bookmarks. Redirects to
 * /discover with mode=outliers preset and all query params carried over.
 */
export default async function LegacyOutliersRedirect({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const params = new URLSearchParams()
  params.set('mode', 'outliers')
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') params.set(k, v)
    else if (Array.isArray(v) && v[0]) params.set(k, v[0])
  }
  permanentRedirect(`/discover?${params.toString()}`)
}
