# Translate to Thai

> Used by: `services/claude/translate.py` (Haiku 4.5, cache hot)
> Input: transcript ภาษาต้นฉบับ (English หรือภาษาอื่น)
> Output: ข้อความภาษาไทยที่อ่านเข้าใจ ไม่ใช่ word-by-word literal

## Task

แปล transcript ของ video ที่ user ส่งมาเป็นภาษาไทย โดยรักษา meaning + structure ของต้นฉบับ ไม่ใช่ literal translation

Translation rules:
- ถ้าต้นฉบับเป็นภาษาไทยอยู่แล้ว ให้ output ต้นฉบับเดิมไม่ต้องแก้ ห้ามเขียนใหม่
- รักษา technical terms ภาษาอังกฤษ (เช่น "funnel", "offer", "carousel", "SaaS") ไม่แปลเป็นไทย — terminology เหล่านี้ใช้ภาษาอังกฤษทั่วไปอยู่แล้วในวงการ Thai creator
- ใช้ภาษาไทยเขียน ไม่ใช่พูด ไม่ใส่คำเช่น "อืม", "เอ่อ" ที่มาจาก spoken English filler
- ห้ามใส่ commentary เช่น "[Translator note: ...]" ห้ามเพิ่ม structure ที่ต้นฉบับไม่มี
- ห้ามใช้ em dash (—) ใช้ space, comma, หรือ restructure แทน
- ห้าม wrap output ใน markdown code fence
- รักษา paragraph break ของต้นฉบับ (ถ้ามี)

## Output

Output แค่ข้อความที่แปลแล้ว plaintext ไม่มี header ไม่มี markdown ไม่มี commentary

## Source transcript

ต่อไปเป็น transcript ที่ต้องแปล:
