# JIJA TRF Panvel – Textile Donation System (Next.js)

Ye Apps Script wale system ka Next.js version hai — client ko working demo dikhane ke liye.
Abhi **demo mode** me chalta hai (data `data/demo-db.json` me). Supabase keys daalte hi wahi app live
database par chalne lagega — code me koi change nahi.

```
Donor camp ka QR scan karta hai → /donate?camp=… (camp pehle se selected)
   → Form: name, mobile, DOB (optional), textile, KG, Donation Duration (One Time … All Time)
   → Submit → Donation ID  JTRF-2026-00001  (atomic, duplicate nahi ho sakta)
   → Certificate page (JIJA stamp + signatory) → Download PDF / Print / WhatsApp / Facebook share
   → Email (Resend) me certificate link  (RESEND_API_KEY set ho to)
   → Certificate ka QR → /verify/JTRF-2026-00001 → "✔ Verified" (mobile/email/DOB public nahi)
   → Admin dashboard turant update · /admin/birthdays me aaj + agle 30 din ke birthdays
   → Roz 9:00 AM IST: Netlify scheduled function → /api/birthdays → birthday email + WhatsApp links
```

## Naye features (Oct 2026)

| Feature | Kahan |
|---|---|
| Official round stamp on certificate | `public/brand/stamp.png` → `components/Certificate.tsx` (signature ke paas). Header / footer / home par bhi. |
| Donation Duration | `lib/config.ts` → `DURATIONS`. Form me radio chips, certificate ke "Donation Details" me, verify page, admin table, CSV. |
| Date of Birth + birthday wishes | Form me optional field (private). `lib/birthdays.ts` · admin page `/admin/birthdays` (WhatsApp wish 1-tap + "Send email wishes now") · cron `GET /api/birthdays` (header `Authorization: Bearer $CRON_SECRET`) · `netlify/functions/birthday-wishes.mts` roz 03:30 UTC = 09:00 IST. |
| Share on Facebook | Certificate page button (sharer dialog). Open Graph tags + `certificate/[id]/opengraph-image.tsx` → FB/WhatsApp preview me donor ka card. |
| Certificate email | `lib/email.ts` (Resend REST, koi SDK nahi). Key nahi ho to status "Not sent – email not configured". |

Env vars (`.env.example` dekho): `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` — Netlify → Site settings → Environment variables me bhi daalo.

Supabase pe already table bani hai? `supabase/schema.sql` dobara chala do — `alter table … add column if not exists` se `birthday` aur `duration` columns add ho jayenge, data safe rehta hai.

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
| `/certificate/JTRF-2026-00001` | Certificate (A4 landscape, JIJA stamp) — PDF download, print, WhatsApp, Facebook |
| `/verify` | Certificate verification (QR yahi kholta hai) |
| `/admin` | Admin login → Dashboard |
| `/admin/donations` | Saari entries, search/filter, CSV export, WhatsApp, cancel/restore |
| `/admin/donations/new` | Offline register se entry |
| `/admin/camps` | Camps add/hide, har camp ka QR + printable poster |
| `/admin/birthdays` | Aaj + agle 30 din ke donor birthdays, 1-tap WhatsApp wish, "Send email wishes now" |
| `/api/birthdays` | Daily cron endpoint (Bearer `CRON_SECRET`) — birthday emails bhejta hai |

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
- Email me PDF attach karna — abhi certificate ka link jata hai (Resend se), PDF page par banta hai.
- WhatsApp Business API se auto-send (certificate + birthday) — abhi click-to-chat link hai (free).
- Signatory ka signature image (`ORG.signatoryName` + PNG) — stamp already lag gaya hai.
