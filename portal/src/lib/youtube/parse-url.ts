/**
 * Extract YouTube channel reference from various URL formats:
 *   https://youtube.com/@earthrati
 *   https://www.youtube.com/@earthrati
 *   https://youtube.com/channel/UCxxxx
 *   https://youtube.com/c/customname
 *   @earthrati
 *   UCxxxxxxxxxxxxxxxxxxxxxx
 *
 * Returns one of:
 *   { kind: 'handle', value: 'earthrati' }
 *   { kind: 'channel_id', value: 'UCxxxx...' }
 *   { kind: 'custom', value: 'customname' }
 *
 * Worker resolves these to the canonical channelId via YouTube Data API.
 */

export type ChannelRef =
  | { kind: 'handle'; value: string }
  | { kind: 'channel_id'; value: string }
  | { kind: 'custom'; value: string }

export function parseYouTubeChannelUrl(input: string): ChannelRef | null {
  const raw = input.trim()
  if (!raw) return null

  // Bare channel ID
  if (/^UC[A-Za-z0-9_-]{20,}$/.test(raw)) {
    return { kind: 'channel_id', value: raw }
  }

  // Bare @handle
  if (/^@[A-Za-z0-9._-]+$/.test(raw)) {
    return { kind: 'handle', value: raw.slice(1) }
  }

  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  if (!/youtube\.com$/.test(url.hostname.replace(/^www\./, ''))) {
    return null
  }

  const path = url.pathname.replace(/\/+$/, '')

  // /@handle
  const handleMatch = path.match(/^\/@([A-Za-z0-9._-]+)$/)
  if (handleMatch) return { kind: 'handle', value: handleMatch[1] }

  // /channel/UCxxxx
  const channelMatch = path.match(/^\/channel\/(UC[A-Za-z0-9_-]{20,})$/)
  if (channelMatch) return { kind: 'channel_id', value: channelMatch[1] }

  // /c/customName
  const customMatch = path.match(/^\/c\/([A-Za-z0-9._-]+)$/)
  if (customMatch) return { kind: 'custom', value: customMatch[1] }

  // /user/legacyName (treat as custom)
  const userMatch = path.match(/^\/user\/([A-Za-z0-9._-]+)$/)
  if (userMatch) return { kind: 'custom', value: userMatch[1] }

  return null
}
