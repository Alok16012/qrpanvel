# JIJA TRF Panvel – Textile Donation System (Next.js)

Ye Apps Script wale system ka Next.js version hai — client ko working demo dikhane ke liye.
Abhi **demo mode** me chalta hai (data `data/demo-db.json` me). Supabase keys daalte hi wahi app live
database par chalne lagega — code me koi change nahi.

```
Donor camp ka QR scan karta hai → /donate?camp=… (camp pehle se selected)
   → Form submit → Donation ID  JTRF-2026-00001  (atomic, duplicate nahi ho sakta)
   → Certificate page → Download PDF / Print / WhatsApp share
   → Certificate ka QR → /verify/JTRF-2026-00001 → "✔ Verified" (mobile/email public nahi)
   → Admin dashboard turant update
```

## Chalana

```bash
cd web
npm install
npm run dev
```

Phir kholo: http://localhost:3000

| Page | Kya hai |
|---|---|
| `/` | Landing page + live total KG / donations |
| `/donate` | Donor registration form (`?camp=<slug>` se camp pre-selected) |
| `/certificate/JTRF-2026-00001` | Certificate (A4 landscape) — PDF download, print, WhatsApp |
| `/verify` | Certificate verification (QR yahi kholta hai) |
| `/admin` | Admin login → Dashboard |
| `/admin/donations` | Saari entries, search/filter, CSV export, WhatsApp, cancel/restore |
| `/admin/donations/new` | Offline register se entry |
| `/admin/camps` | Camps add/hide, har camp ka QR + printable poster |

**Demo admin password:** `jtrf@2026` (jab tak `ADMIN_PASSWORD` set nahi hai, login page par dikhta hai).

### Client ko demo dikhane ka tareeka
1. Landing page → **Register donation** → **Fill demo data** → Submit → certificate turant.
2. **Download PDF** dabao → asli PDF file.
3. Phone se certificate ka QR scan → verify page.
   (Phone aur laptop same Wi-Fi par hon; laptop ka IP use karo, jaise `http://192.168.1.5:3000`,
   ya `NEXT_PUBLIC_SITE_URL` set karo.)
4. `/admin` → dashboard me naya donation dikh jayega → Camps & QR → poster print.
5. Demo data wapas original karna ho: **Camps & QR → Reset demo data**.

## Supabase par le jaana (production)

1. Supabase project banao → **SQL Editor** → `supabase/schema.sql` paste karke Run.
2. `.env.example` ko `.env.local` me copy karo aur bharo:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
3. Restart → app ab Supabase use karega (admin sidebar se "Demo mode" note hat jayega).

Donation ID Postgres function `create_donation()` me banta hai (counter row lock ke saath),
isliye ek saath kai submissions par bhi ID duplicate nahi hota. Har saal ID reset: `JTRF-2027-00001`.
Saari tables par RLS on hai; sirf server (service-role key) data padhta/likhta hai.

> Vercel par bina Supabase ke demo data temporary rahega (server restart par reset). Client ko
> online link dena ho to Supabase free project laga do.

## Code structure

```
src/lib/db/            Store interface → json-store.ts (demo) | supabase-store.ts (live)
src/lib/validation.ts  Form rules (Google Form wale hi: 10-digit mobile, KG > 0, …)
src/lib/auth.ts        Admin password + signed cookie session
src/components/Certificate.tsx  Certificate design (Slides template jaisa hi layout)
src/app/actions.ts     Server actions (submit, login, cancel, camps)
supabase/schema.sql    Tables + atomic ID function
```

## Abhi baaki (next phase)
- Email me PDF bhejna (Resend / SMTP) — abhi status `Demo – not sent` dikhata hai.
- WhatsApp Business API se auto-send — abhi click-to-chat link hai (free).
- Organisation logo / signature image certificate me.
