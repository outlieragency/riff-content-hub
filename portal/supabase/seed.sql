-- seed.sql
-- รันหลังจาก user แรก sign up เพื่อ bootstrap voice profile
-- หา user_id จาก auth.users แล้ว run มือ:
--
--   psql ... -v user_id=<uuid> -f seed.sql
--
-- หรือใน Supabase SQL editor แทน :user_id ด้วย UUID จริง

insert into public.voice_profiles (user_id, name, voice_profile)
values (
  :'user_id',
  'Earth — Outlier Agency',
  jsonb_build_object(
    'tone_words', jsonb_build_array('direct', 'practical', 'no-fluff', 'Buddhist-pragmatic'),
    'signature_phrases', jsonb_build_array(
      'ลองดูเดี๋ยวก็รู้เอง',
      'ทุกอย่างเป็นไปตามเหตุปัจจัย มีเหตุ จึงมีผล',
      'จริง ๆ แล้ว',
      'เอาตรง ๆ'
    ),
    'vocabulary', jsonb_build_object(
      'thai_english_mix', 70,
      'register', 'casual but substantive'
    ),
    'sentence_rhythm', 'short punchy mostly, mix with longer for nuance',
    'dos', jsonb_build_array(
      'speak from real experience not theory',
      'use industry terms in English (Sales Funnel, Offer, Leverage)',
      'practical tactical over motivational',
      'humor allowed but never breaks credibility'
    ),
    'donts', jsonb_build_array(
      'no hype or overpromise',
      'no em dash',
      'no ellipsis when not needed',
      'no excessive emoji in copy',
      'no นะคะ/ค่ะ (male voice, ครับ)',
      'do not teach the audience, talk as friend',
      'no corporate speak'
    ),
    'samples', jsonb_build_array()
  )
)
on conflict do nothing;
