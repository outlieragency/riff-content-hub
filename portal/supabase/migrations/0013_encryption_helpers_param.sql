-- 0013_encryption_helpers_param.sql
-- Replace 0012's encryption helpers with key-as-parameter pattern.
-- Reason: Supabase managed Postgres restricts ALTER DATABASE for custom GUCs,
-- so reading `app.encryption_key` from current_setting() fails on most tiers.
--
-- New pattern: caller (server action / worker) passes the key explicitly
-- from APP_ENCRYPTION_KEY env var. The DB helpers do pure pgcrypto wrap.
--
-- Trade-off: key transits in RPC payload (TLS-protected). Acceptable.
-- Benefit: zero DB-level secret config; works on any Supabase tier.

-- =========================================================
-- Drop old single-arg variants (if they exist from 0012)
-- =========================================================
drop function if exists public.encrypt_secret(text);
drop function if exists public.decrypt_secret(text);

-- =========================================================
-- New 2-arg variants — key passed by caller
-- =========================================================
create or replace function public.encrypt_secret(plaintext text, key text)
returns text
language plpgsql
as $$
begin
  if plaintext is null or plaintext = '' then return null; end if;
  if key is null or key = '' then return null; end if;
  return encode(pgp_sym_encrypt(plaintext, key), 'base64');
end;
$$;

create or replace function public.decrypt_secret(ciphertext text, key text)
returns text
language plpgsql
as $$
begin
  if ciphertext is null or ciphertext = '' then return null; end if;
  if key is null or key = '' then return null; end if;
  return pgp_sym_decrypt(decode(ciphertext, 'base64'), key);
exception when others then
  return null;
end;
$$;

revoke all on function public.encrypt_secret(text, text) from public;
revoke all on function public.decrypt_secret(text, text) from public;
grant execute on function public.encrypt_secret(text, text) to service_role;
grant execute on function public.decrypt_secret(text, text) to service_role;
