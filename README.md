# JIJA TRF Panvel – Digital Textile Donation Management System

**JIJA Textile Recovery Facility – Panvel** · 📞 98346 65566 · ✉️ jtrfp@jijagroup.in · 🌐 jijagroup.in

Do versions, ek hi design:

| Folder | Kya hai |
|---|---|
| `web/` | **Next.js website** (Netlify par live) – QR form, instant stamped PDF certificate, verify page, admin dashboard, birthdays. Setup: `web/README.md` |
| `apps-script/` | **Google Form + Sheet + Apps Script** version – zero hosting, sab Google Drive me. Setup niche. |

Dono me ye features hain:

- Donor name + donation weight (KG), unique certificate ID **`JTRF-2026-00001`** (year-wise auto reset)
- **Donation Duration**: One Time · Weekly · Monthly · Quarterly · 6 Months · 1–5 Years · All Time (certificate par print hota hai)
- **Date of Birth** (optional, private) + **automatic birthday wishes** roz subah 9 baje (email) + 1-tap WhatsApp wish
- Automatic **PDF certificate** with official **JIJA round stamp** + Authorized Signatory
- **Share on WhatsApp** + **Share on Facebook** (link preview me donor ka certificate card dikhta hai)
- QR verification (mobile / email / DOB kabhi public nahi)

---

## Google version: Form + Sheet + Apps Script + Drive + Slides (certificate) + Looker Studio

```
Donor QR scan → Google Form → Submit
   → Sheet "Donations" me entry
   → Donation ID  JTRF-2026-00001   (LockService + counter, duplicate ho hi nahi sakta)
   → Slides template copy → Name + KG + Date + ID + QR fill
   → PDF → Drive: "JIJA TRF – Donation System/Certificates (PDF)/2026/"
   → Certificate link + status Sheet me
   → Email hai to PDF email
   → WhatsApp share link (1 tap)
   → Dashboard update (Total donors | KG | Footwear | Camp-wise | Society-wise | Month-wise)
```

## Files

| File | Kya hai |
|---|---|
| `apps-script/Code.gs` | Poora system (setup, form, ID, certificate, email, dashboard, QR, verify) |
| `apps-script/Verify.html` | QR scan karne par khulne wala "Certificate Verified ✔" page |
| `apps-script/appsscript.json` | Manifest (Slides advanced service + web app settings) |

---

## Setup (sirf ek baar, ~10 min)

1. **Naya Google Sheet banao** → naam: `JIJA TRF – Donations 2026`
2. **Extensions → Apps Script** kholo.
3. `Code.gs` ka sara content paste karo (purana code hata do).
4. **+ → HTML** → naam `Verify` → `Verify.html` ka content paste karo.
5. **Project Settings (⚙️) → "Show appsscript.json manifest file"** tick karo → `appsscript.json` me humara content paste karo.
6. `Code.gs` ke upar **CONFIG** me check karo: phone, email, camps ki list, signatory name,
   `STAMP_IMAGE_URL` (stamp PNG ka public link, e.g. `https://<netlify-site>/brand/stamp.png`), `BIRTHDAY_HOUR`.
7. Save → Sheet ko refresh karo → menu me **JIJA TRF → 1. Setup System** chalao.
   - Pehli baar Google permission maangega → *Advanced → Go to project → Allow*.
8. Setup ye sab apne aap bana dega:
   - Google Form (validation ke saath: 10-digit mobile, KG > 0, valid email)
   - `Donations` sheet + system columns
   - Drive folders + **Certificate template (Google Slides, A4 landscape)**
   - `Dashboard` sheet
   - Form submit trigger + **daily birthday trigger** (9 AM)
   - `Camp QR Links` sheet + Drive me QR PNGs (general + har camp ka alag QR)

### Verification QR chalu karna (recommended)
1. Apps Script → **Deploy → New deployment → Web app**
   - Execute as: **Me** · Who has access: **Anyone** → Deploy
2. Jo `/exec` URL mile, use `CONFIG.VERIFY_URL` me paste karke Save karo.
3. Ab har certificate ke QR scan se page khulega: **✔ Verified – Name, KG, Date, ID**
   (mobile / email / address public nahi dikhte).

---

## Sheet columns (header-name based)

Form questions → Sheet headers (script inhi **naamon** se data padhta hai, column number se nahi):

`Timestamp | Donor Name | Donor Type | Organization / Society / School Name | Mobile Number | Email (certificate will be emailed) | Address | Date of Birth (for birthday wishes) | Type of Textile | Estimated Quantity (Kg) | Number of Items (approx.) | Footwear (pairs) | Donation Duration | Collection Camp / Location | Date of Donation | Consent`

System columns (script khud add karta hai):

`Donation ID | Certificate Status | Certificate Link | Certificate File ID | Email Status | WhatsApp Share Link | Facebook Share Link | Verify Link | Processed At`

> Purana Form/Sheet already bana hua hai? Form me 2 naye question add karo (titles exactly upar jaise:
> `Date of Birth (for birthday wishes)` – Date, aur `Donation Duration` – Dropdown with CONFIG.DURATIONS values).
> Sheet me columns apne aap aa jayenge. Phir Slides template me `{{DURATION}}` placeholder add karo.

> Form me questions aage-peeche karo, naya question jodo — system chalta rahega.
> ⚠️ Bas **question ka title mat badlo**. Badalna ho to `Code.gs` ke `Q` object me bhi wahi text likho.

---

## Certificate design

- Template: Drive → `JIJA TRF – Donation System/Template/JIJA TRF – Certificate Template`
- Aapke dono designs ka mix: JIJA brand, green + gold border, "TEXTILE DONATION CERTIFICATE / वस्त्र दान प्रमाणपत्र",
  **Donor Name, KG aur Donation ID sabse bade**, Donation Details box, QR, Authorized Signatory, green footer.
- Design badalna ho to Slides me seedha edit karo. **Apna banaya hua image (jaise upar wala certificate) background
  me lagana ho**: Slide → *Change background → Choose image* — aur text boxes rakho.
- Placeholders jo zaroor rakhne hain:
  `{{DONOR_NAME}} {{ORGANIZATION}} {{WEIGHT}} {{DONATION_ID}} {{DONATION_DATE}} {{TEXTILE_TYPE}} {{ITEMS}} {{FOOTWEAR}} {{DURATION}} {{LOCATION}} {{SIGNATORY_NAME}} {{SIGNATORY_DESIGNATION}} {{ISSUE_DATE}} {{QR}}`
- `{{QR}}` wala box jahan rakhoge, QR wahi aayega (usi size me).
- **Stamp**: `CONFIG.STAMP_IMAGE_URL` set ho to Setup template me signature ke paas round stamp laga deta hai.
  Ya template me `web/public/brand/stamp.png` khud insert kar do. Signature image bhi aise hi insert karo — har certificate me aayega.
- Lamba naam ho to font apne aap chhota ho jata hai.

## Daily use

| Kaam | Kaise |
|---|---|
| Camp par registration | `Camp QR Links` sheet / Drive QR folder se us camp ka QR print karo (camp pehle se selected rahega) |
| Kisi certificate me error | Row select → **JIJA TRF → Regenerate certificate (selected row)** (ID wahi rehta hai) |
| Offline register se entry | `Donations` sheet me row bharo (Donor Name, KG, …) → **Process pending rows** |
| WhatsApp par bhejna | Row ke `WhatsApp Share Link` par click → WhatsApp me message ready → Send |
| Facebook par share | Row ke `Facebook Share Link` par click (ya donor khud verify page se "Share on Facebook") |
| Birthday wishes | Roz 9 AM apne aap: email jata hai + `Birthdays` sheet me WhatsApp wish link. Manually: **JIJA TRF → Send today's birthday wishes** |
| Dashboard | `Dashboard` sheet (har submit par auto update) |

## Looker Studio dashboard

1. lookerstudio.google.com → **Create → Report → Google Sheets** → ye sheet → `Donations` tab.
2. Suggested charts:
   - Scorecards: Record Count (Total donations), SUM `Estimated Quantity (Kg)`, SUM `Footwear (pairs)`, COUNT_DISTINCT `Mobile Number` (unique donors)
   - Bar chart: Dimension `Collection Camp / Location`, Metric SUM KG
   - Bar chart: `Organization / Society / School Name` vs SUM KG
   - Time series: `Date of Donation` (Month) vs SUM KG
   - Pie: `Donor Type`
   - Date range control + Camp filter control
3. Share → sirf "View" access do. (Mobile / email columns report me mat dikhao.)

## Limits & notes

- Gmail se email: free account ~100/day, Workspace ~1500/day. Quota khatam ho to status `Quota exhausted` → agle din *Process pending rows*.
- QR images `quickchart.io` se bante hain (sirf verify URL / form link jata hai, donor data nahi).
- `SHARE_PDF_WITH_LINK: true` → certificate link jiske paas hai wo dekh sakta hai (WhatsApp share ke liye zaroori). Nahi chahiye to `false`.
- Har saal ID apne aap reset: `JTRF-2027-00001`.
- Aage: WhatsApp Business API (Interakt / Gupshup / Meta Cloud API) se PDF auto-send — `whatsappLink_()` ki jagah API call lagana hoga.
