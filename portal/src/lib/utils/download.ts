/**
 * Force-download a remote URL as a file (bypasses cross-origin inline display).
 *
 * Why this is needed: Supabase Storage serves files with Content-Disposition
 * inline, so <a href download> just opens the image in a new tab instead of
 * downloading. Fetching → Blob → object URL forces the download.
 */
export async function downloadUrlAs(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) {
    throw new Error(`download fetch failed: ${res.status}`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Free memory after the click handler runs
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
