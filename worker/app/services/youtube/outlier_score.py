"""Outlier score computation.

Formula (industry standard, มาตรฐานเดียวกับ Sortlytics / vidIQ):
  outlier_score = video.view_count / channel.subscriber_count

ทำไมต้อง views / subscribers:
  วัดว่า video reach ออกนอกฐานแฟนเดิมไปได้แค่ไหน — score 5x แปลว่า reach
  คนนอกฐาน 4 เท่าของฐานเดิม สมการนี้คือ "viral signal" ที่ creator ตลาด recognize ทันที

ทำไม subscriber_count:
  Stable, public, ไม่ต้อง compute, accurate พอสำหรับ comparison
  (ทาง Sortlytics/vidIQ ก็ใช้สูตรนี้ Earth คุ้นเคยอยู่แล้ว)

`channel_avg_views` (median ของ 30 long-form ล่าสุด) ยังเก็บไว้ใน DB เป็น secondary metric
สำหรับ "ค่ากลางของช่อง" ที่ผู้ใช้อาจอยากดูแยก ไม่ได้ใช้ใน score formula
"""

from __future__ import annotations

from collections.abc import Iterable
from statistics import median


def compute_channel_avg_views(videos: Iterable[dict]) -> float | None:
    """Median ของ 30 long-form video ล่าสุด (exclude Shorts).

    เก็บเป็น secondary metric ที่ channel level ไม่ได้ใช้ใน outlier_score
    """
    long_form = [
        v for v in videos
        if not v.get("is_short")
        and v.get("view_count") is not None
        and v.get("published_at")
    ]
    if not long_form:
        return None

    long_form.sort(key=lambda v: v["published_at"], reverse=True)
    sample = long_form[:30]

    if len(sample) < 3:
        return None

    return float(median(v["view_count"] for v in sample))


def compute_score(
    view_count: int | None,
    subscriber_count: int | None,
    fallback_avg_views: float | None = None,
) -> float | None:
    """outlier_score = views / subscribers; None ถ้าคำนวณไม่ได้.

    Fallback chain (เพื่อกัน channel ที่ hide subs หรือ subs = 0):
      1. ถ้า subscriber_count > 0 → views / subscriber_count (primary, industry std)
      2. ถ้า subs missing/0 + fallback_avg_views > 0 → views / fallback_avg_views (median ของช่อง)
      3. ถ้าทั้งคู่ไม่มี → None

    Args:
        view_count: ยอด view ของ video
        subscriber_count: จำนวน subscriber ของช่อง (จาก channels.subscriber_count)
        fallback_avg_views: median view ของช่อง (จาก channels.channel_avg_views)
                           ใช้เมื่อ subscriber_count missing หรือ 0
    """
    if not view_count:
        return None
    if subscriber_count and subscriber_count > 0:
        return view_count / subscriber_count
    if fallback_avg_views and fallback_avg_views > 0:
        return view_count / fallback_avg_views
    return None
