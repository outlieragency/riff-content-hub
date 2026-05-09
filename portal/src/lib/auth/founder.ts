/**
 * Founder identity check.
 * Founders see admin tabs (e.g. /admin/users) and can mutate the
 * email allowlist. Non-founders never see those routes.
 *
 * Configured via FOUNDER_EMAILS env (comma-separated). Server-only.
 */
function getFounderEmails(): string[] {
  const raw = process.env.FOUNDER_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getFounderEmails().includes(email.toLowerCase())
}
