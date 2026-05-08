-- 0003_seed_voice_profile.sql
-- Bootstrap voice profile ของ Earth (ใช้เป็น default ถ้ายังไม่ extract เอง)
-- จะใช้ตอน Slice 5 (YT Script recreate) ก่อนที่ Voice extraction (Slice 3) จะพร้อม
-- ลบ row นี้ได้หลังจาก Earth extract voice ของตัวเองจริง

-- หมายเหตุ: ใช้ DO block + นำเข้าตอน user ลงทะเบียนครั้งแรก
-- (seed.sql แทน migration เพราะ user_id ยังไม่มีตอน migrate)

-- ดู portal/supabase/seed.sql สำหรับ insert seed
-- migration นี้แค่ document schema ของ voice_profile JSONB shape

comment on column public.voice_profiles.voice_profile is
'Brand voice profile JSONB shape:
{
  "tone_words": ["direct", "practical", "no-fluff", "Buddhist-pragmatic"],
  "signature_phrases": ["ลองดูเดี๋ยวก็รู้เอง", "ทุกอย่างเป็นไปตามเหตุปัจจัย"],
  "vocabulary": {
    "thai_english_mix": 70,
    "register": "casual but substantive"
  },
  "sentence_rhythm": "short punchy 2-8 words, mix with longer when needed",
  "dos": ["use real examples", "speak from experience", "Thai-English natural mix"],
  "donts": [
    "no hype/overpromise",
    "no em dash",
    "no excessive emoji",
    "no นะคะ/ค่ะ (male voice)",
    "do not teach, talk as friend"
  ],
  "samples": [
    {"text": "...", "type": "youtube_caption", "date": "2026-04-15"}
  ]
}
Reference: Operation/products/outlier-carousel/SPEC.md §6';
