/**
 * Supabase service-role client. Bypasses RLS.
 *
 * Use ONLY in server actions / route handlers — NEVER expose to client.
 * Used for calling SECURITY DEFINER RPC functions like encrypt_secret /
 * decrypt_secret which require service_role grant.
 */

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required',
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
