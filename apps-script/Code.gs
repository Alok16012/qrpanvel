/**
 * JIJA TRF Panvel – Digital Textile Donation Management System
 * ------------------------------------------------------------
 * Google Form → Google Sheet → Donation ID → PDF Certificate (Slides template)
 * → Drive → Email → WhatsApp share link → Dashboard → QR verification web app.
 *
 * Bind this script to a Google Sheet (Extensions → Apps Script), paste all
 * files, then run menu "JIJA TRF → 1. Setup System" once.
 *
 * Key design rules:
 *  - Columns are found by HEADER NAME, never by fixed column number.
 *  - Donation IDs come from a LockService-protected counter (PropertiesService),
 *    cross-checked against the sheet, so parallel submissions never collide.
 *  - Every step is idempotent: re-running never creates a second ID for a row.
 */

// ========================= CONFIG (edit here) =========================
const CONFIG = {
  ORG_NAME: 'JIJA Textile Recovery Facility – Panvel',
  ORG_SHORT: 'JIJA TRF Panvel',
  ID_PREFIX: 'JTRF',          // → JTRF-2026-00001
  ID_DIGITS: 5,
  PHONE: '98346 65566',
  WEBSITE: 'jijagroup.in',
  EMAIL: 'jtrfp@jijagroup.in',
  ADDRESS: 'Panvel, Navi Mumbai, Maharashtra',
  TIMEZONE: 'Asia/Kolkata',

  RESPONSE_SHEET: 'Donations',
  DASHBOARD_SHEET: 'Dashboard',
  CAMP_QR_SHEET: 'Camp QR Links',
  ROOT_FOLDER: 'JIJA TRF – Donation System',

  SEND_EMAIL: true,             // email PDF if donor gave an email
  SHARE_PDF_WITH_LINK: true,    // "anyone with link can view" for certificate PDFs

  // After Deploy → Web app, paste the /exec URL here (used inside certificate QR).
  VERIFY_URL: '',

  SIGNATORY_NAME: '',           // e.g. 'Mrs. ABC' – leave blank for empty line
  SIGNATORY_DESIGNATION: 'Authorized Signatory',

  // Collection camps / locations (shown in the Form + used for camp-wise QR codes)
  CAMPS: [
    'Neelkanth Darshan Society – Opp. Orion Mall, Panvel',
    'JIJA TRF Facility – Panvel',
    'Doorstep Pickup',
  ],
};

// Form question titles. The Sheet headers will be exactly these texts,
// and the script reads data by these names (order does not matter).
const Q = {
  NAME: 'Donor Name',
  DONOR_TYPE: 'Donor Type',
  ORG: 'Organization / Society / School Name',
  MOBILE: 'Mobile Number',
  EMAIL: 'Email (certificate will be emailed)',
  ADDRESS: 'Address',
  TEXTILE: 'Type of Textile',
  WEIGHT: 'Estimated Quantity (Kg)',
  ITEMS: 'Number of Items (approx.)',
  FOOTWEAR: 'Footwear (pairs)',
  CAMP: 'Collection Camp / Location',
  DATE: 'Date of Donation',
  CONSENT: 'Consent',
};

// Columns added by the system (to the right of form columns).
const SYS = {
  ID: 'Donation ID',
  STATUS: 'Certificate Status',
  LINK: 'Certificate Link',
  FILE_ID: 'Certificate File ID',
  EMAIL_STATUS: 'Email Status',
  WHATSAPP: 'WhatsApp Share Link',
  VERIFY: 'Verify Link',
  PROCESSED: 'Processed At',
};

const COLORS = {
  green: '#1B5E20', green2: '#2E7D32', leaf: '#43A047', mint: '#EEF6EA',
  mintBorder: '#A5D6A7', gold: '#C9A227', navy: '#1A237E', cream: '#FBFAF3',
  text: '#263238', muted: '#607D8B', white: '#FFFFFF',
};

// ========================= MENU =========================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('JIJA TRF')
    .addItem('1. Setup System (first time)', 'setupSystem')
    .addSeparator()
    .addItem('Process pending rows', 'processPendingRows')
    .addItem('Regenerate certificate (selected row)', 'regenerateSelectedRow')
    .addItem('Refresh dashboard', 'refreshDashboard')
    .addItem('Generate registration / camp QR codes', 'generateCampQRCodes')
    .addSeparator()
    .addItem('Show system links', 'showLinks')
    .addToUi();
}

// ========================= SETUP =========================
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  // 1) Drive folders
  const root = getOrCreateFolder_(DriveApp.getRootFolder(), CONFIG.ROOT_FOLDER);
  const certFolder = getOrCreateFolder_(root, 'Certificates (PDF)');
  const qrFolder = getOrCreateFolder_(root, 'QR Codes');
  const tplFolder = getOrCreateFolder_(root, 'Template');
  props.setProperties({
    ROOT_FOLDER_ID: root.getId(),
    CERT_FOLDER_ID: certFolder.getId(),
    QR_FOLDER_ID: qrFolder.getId(),
  });

  // 2) Certificate template (Google Slides, A4 landscape)
  if (!fileExists_(props.getProperty('TEMPLATE_ID'))) {
    const tplId = createCertificateTemplate_();
    DriveApp.getFileById(tplId).moveTo(tplFolder);
    props.setProperty('TEMPLATE_ID', tplId);
  }

  // 3) Google Form linked to this Sheet
  if (!fileExists_(props.getProperty('FORM_ID'))) {
    const before = ss.getSheets().map(s => s.getSheetId());
    const form = createForm_();
    DriveApp.getFileById(form.getId()).moveTo(root);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    SpreadsheetApp.flush();
    Utilities.sleep(2000);
    const fresh = SpreadsheetApp.openById(ss.getId());
    const respSheet = fresh.getSheets().find(s => before.indexOf(s.getSheetId()) === -1 && s.getFormUrl())
      || fresh.getSheets().find(s => s.getFormUrl());
    if (!respSheet) throw new Error('Form response sheet not found. Run Setup again.');
    if (!fresh.getSheetByName(CONFIG.RESPONSE_SHEET)) respSheet.setName(CONFIG.RESPONSE_SHEET);
    props.setProperties({ FORM_ID: form.getId(), RESPONSE_SHEET_GID: String(respSheet.getSheetId()) });
  }

  // 4) System columns + header styling
  const sheet = getResponseSheet_();
  ensureSystemColumns_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setFontWeight('bold').setBackground(COLORS.green).setFontColor(COLORS.white).setWrap(true);

  // 5) Dashboard + trigger + QR codes
  refreshDashboard();
  installTrigger_();
  generateCampQRCodes(true);

  showLinks();
}

function installTrigger_() {
  const ss = getSs_();
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'handleFormSubmit')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('handleFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
}

function createForm_() {
  const form = FormApp.create('Textile Donation Registration – ' + CONFIG.ORG_SHORT);
  form.setTitle('वस्त्रदान शिबिर | Textile Donation Registration')
    .setDescription(
      CONFIG.ORG_NAME + '\n' +
      'Give Old Clothes a New Life ♻️  —  Donate • Recover • Reuse • Recycle\n\n' +
      'Fill this form when you hand over your textiles. ' +
      'Your Certificate of Donation (PDF) will be generated automatically.')
    .setConfirmationMessage(
      'धन्यवाद! Thank you for your donation 🌿\n' +
      'Your certificate is being generated. If you entered an email, it will arrive in a few minutes.\n' +
      'Contact: ' + CONFIG.PHONE)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(true)
    .setProgressBar(false);

  form.addTextItem().setTitle(Q.NAME).setHelpText('दात्याचे नाव — as it should appear on the certificate')
    .setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q.DONOR_TYPE)
    .setChoiceValues(['Individual', 'Society', 'Company / CSR Partner', 'School / College', 'NGO / Other'])
    .setRequired(true);

  form.addTextItem().setTitle(Q.ORG).setHelpText('Optional — e.g. Neelkanth Darshan Society');

  form.addTextItem().setTitle(Q.MOBILE).setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^[6-9][0-9]{9}$')
      .setHelpText('Enter a 10-digit mobile number').build());

  form.addTextItem().setTitle(Q.EMAIL)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail()
      .setHelpText('Enter a valid email').build());

  form.addParagraphTextItem().setTitle(Q.ADDRESS);

  form.addCheckboxItem().setTitle(Q.TEXTILE)
    .setChoiceValues(['Clothes', 'Footwear', 'Bags', 'Bedsheets / Curtains', 'Towels / Linen'])
    .showOtherOption(true).setRequired(true);

  form.addTextItem().setTitle(Q.WEIGHT).setHelpText('Approximate weight in KG (e.g. 5 or 7.5)').setRequired(true)
    .setValidation(FormApp.createTextValidation().requireNumberGreaterThan(0)
      .setHelpText('Enter weight in KG, greater than 0').build());

  form.addTextItem().setTitle(Q.ITEMS)
    .setValidation(FormApp.createTextValidation().requireWholeNumber()
      .setHelpText('Whole number only').build());

  form.addTextItem().setTitle(Q.FOOTWEAR).setHelpText('Number of pairs (0 if none)')
    .setValidation(FormApp.createTextValidation().requireWholeNumber()
      .setHelpText('Whole number only').build());

  form.addMultipleChoiceItem().setTitle(Q.CAMP)
    .setChoiceValues(CONFIG.CAMPS).showOtherOption(true).setRequired(true);

  form.addDateItem().setTitle(Q.DATE).setRequired(true);

  form.addCheckboxItem().setTitle(Q.CONSENT)
    .setChoiceValues(['I donate these textiles voluntarily for reuse, upcycling and recycling by ' + CONFIG.ORG_SHORT + '.'])
    .setRequired(true);

  return form;
}

// ========================= FORM SUBMIT =========================
function handleFormSubmit(e) {
  const sheet = (e && e.range) ? e.range.getSheet() : getResponseSheet_();
  const row = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
  processRow_(sheet, row, false);
  try { refreshDashboard(); } catch (err) { console.error('Dashboard: ' + err); }
}

/** Retries rows without an ID or with a failed/blank certificate status. */
function processPendingRows() {
  const sheet = getResponseSheet_();
  const cols = ensureSystemColumns_(sheet);
  const last = sheet.getLastRow();
  let done = 0;
  for (let r = 2; r <= last; r++) {
    const rec = readRow_(sheet, r, cols);
    if (!rec.get(Q.NAME)) continue;
    const status = String(rec.get(SYS.STATUS) || '');
    if (!rec.get(SYS.ID) || status === '' || status.indexOf('Error') === 0) {
      processRow_(sheet, r, false);
      done++;
    }
  }
  refreshDashboard();
  toast_(done + ' row(s) processed');
}

function regenerateSelectedRow() {
  const sheet = getResponseSheet_();
  const active = SpreadsheetApp.getActiveSheet();
  if (active.getSheetId() !== sheet.getSheetId()) {
    SpreadsheetApp.getUi().alert('Select a row in the "' + sheet.getName() + '" sheet first.');
    return;
  }
  const row = active.getActiveRange().getRow();
  if (row < 2) return;
  const res = processRow_(sheet, row, true);
  toast_(res.message);
}

/**
 * Assigns ID (under lock) then builds certificate, emails, and writes status.
 * @param {boolean} force regenerate even if already generated (keeps same ID).
 */
function processRow_(sheet, row, force) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let cols, data;
  try {
    cols = ensureSystemColumns_(sheet);
    const rec = readRow_(sheet, row, cols);
    if (!cleanName_(rec.get(Q.NAME))) return { message: 'Row ' + row + ': no donor name, skipped' };

    const status = String(rec.get(SYS.STATUS) || '');
    if (!force && rec.get(SYS.ID) && /^(Generated|Processing)/.test(status)) {
      return { message: 'Row ' + row + ': already ' + status };
    }

    const ts = rec.get('Timestamp');
    const year = Utilities.formatDate(ts instanceof Date ? ts : new Date(), CONFIG.TIMEZONE, 'yyyy');
    const id = String(rec.get(SYS.ID) || '') || nextDonationId_(sheet, cols, year);

    setCell_(sheet, row, cols, SYS.ID, id);
    setCell_(sheet, row, cols, SYS.STATUS, 'Processing');
    SpreadsheetApp.flush();
    data = buildData_(rec, id);
  } finally {
    lock.releaseLock();
  }

  try {
    const pdf = generateCertificate_(data);
    const emailStatus = sendCertificateEmail_(data, pdf);
    setCell_(sheet, row, cols, SYS.LINK, pdf.getUrl());
    setCell_(sheet, row, cols, SYS.FILE_ID, pdf.getId());
    setCell_(sheet, row, cols, SYS.EMAIL_STATUS, emailStatus);
    setCell_(sheet, row, cols, SYS.WHATSAPP, whatsappLink_(data, pdf.getUrl()));
    setCell_(sheet, row, cols, SYS.VERIFY, data.verifyUrl);
    setCell_(sheet, row, cols, SYS.PROCESSED, new Date());
    setCell_(sheet, row, cols, SYS.STATUS, 'Generated');
    return { message: data.id + ': certificate generated (' + emailStatus + ')' };
  } catch (err) {
    console.error(err);
    setCell_(sheet, row, cols, SYS.STATUS, 'Error: ' + String(err.message || err).slice(0, 200));
    return { message: data.id + ': ERROR ' + err.message };
  }
}

function nextDonationId_(sheet, cols, year) {
  const props = PropertiesService.getScriptProperties();
  const key = 'ID_COUNTER_' + year;
  let n = Number(props.getProperty(key) || 0);

  // Cross-check with sheet so a reset property can never produce duplicates.
  const idCol = cols[norm_(SYS.ID)];
  const last = sheet.getLastRow();
  if (last > 1) {
    const re = new RegExp('^' + CONFIG.ID_PREFIX + '-(\\d{4})-(\\d+)$');
    sheet.getRange(2, idCol, last - 1, 1).getValues().forEach(([v]) => {
      const m = String(v).trim().match(re);
      if (m && m[1] === year) n = Math.max(n, Number(m[2]));
    });
  }
  n += 1;
  props.setProperty(key, String(n));
  return CONFIG.ID_PREFIX + '-' + year + '-' + String(n).padStart(CONFIG.ID_DIGITS, '0');
}

function buildData_(rec, id) {
  const ts = rec.get('Timestamp');
  const dateVal = rec.get(Q.DATE) || ts || new Date();
  const weight = toNumber_(rec.get(Q.WEIGHT));
  const items = toNumber_(rec.get(Q.ITEMS));
  const pairs = toNumber_(rec.get(Q.FOOTWEAR));
  return {
    id: id,
    name: cleanName_(rec.get(Q.NAME)),
    org: cleanName_(rec.get(Q.ORG)),
    donorType: String(rec.get(Q.DONOR_TYPE) || '').trim(),
    mobile: String(rec.get(Q.MOBILE) || '').replace(/\D/g, '').slice(-10),
    email: String(rec.get(Q.EMAIL) || '').trim(),
    textile: String(rec.get(Q.TEXTILE) || '').trim() || 'Textiles',
    weight: weight,
    weightText: fmtNum_(weight),
    items: items,
    pairs: pairs,
    location: String(rec.get(Q.CAMP) || '').trim() || CONFIG.ADDRESS,
    dateText: fmtDate_(dateVal),
    verifyUrl: verifyUrlFor_(id),
  };
}

// ========================= CERTIFICATE =========================
function generateCertificate_(data) {
  const props = PropertiesService.getScriptProperties();
  const templateId = props.getProperty('TEMPLATE_ID');
  if (!templateId) throw new Error('Template missing. Run Setup.');
  const folder = getYearFolder_(data.id.split('-')[1]);

  const fileBase = data.id + ' - ' + data.name.replace(/[\\/:*?"<>|#%]/g, '').slice(0, 60);
  const copy = DriveApp.getFileById(templateId).makeCopy(fileBase, folder);
  try {
    const pres = SlidesApp.openById(copy.getId());
    const slide = pres.getSlides()[0];
    const scale = pres.getPageWidth() / 842;

    // Locate special shapes before replacing placeholders.
    let nameShape = null, qrShape = null;
    slide.getPageElements().forEach(el => {
      if (el.getPageElementType() !== SlidesApp.PageElementType.SHAPE) return;
      const t = el.asShape().getText().asString();
      if (t.indexOf('{{DONOR_NAME}}') !== -1) nameShape = el.asShape();
      if (t.indexOf('{{QR}}') !== -1) qrShape = el.asShape();
    });

    const map = {
      '{{DONOR_NAME}}': data.name,
      '{{ORGANIZATION}}': data.org || (data.donorType && data.donorType !== 'Individual' ? data.donorType : ''),
      '{{WEIGHT}}': data.weightText,
      '{{DONATION_ID}}': data.id,
      '{{DONATION_DATE}}': data.dateText,
      '{{TEXTILE_TYPE}}': data.textile,
      '{{ITEMS}}': data.items ? String(data.items) : '—',
      '{{FOOTWEAR}}': String(data.pairs || 0),
      '{{LOCATION}}': data.location,
      '{{SIGNATORY_NAME}}': CONFIG.SIGNATORY_NAME,
      '{{SIGNATORY_DESIGNATION}}': CONFIG.SIGNATORY_DESIGNATION,
      '{{ISSUE_DATE}}': fmtDate_(new Date()),
    };
    Object.keys(map).forEach(k => pres.replaceAllText(k, map[k]));

    // Long names: shrink font so they stay on one/two lines.
    if (nameShape) {
      const len = data.name.length;
      const size = len <= 22 ? 30 : len <= 32 ? 24 : len <= 45 ? 19 : 15;
      nameShape.getText().getTextStyle().setFontSize(size * scale);
    }

    // QR code for verification.
    if (qrShape) {
      try {
        const blob = qrBlob_(data.verifyUrl || (CONFIG.ORG_SHORT + ' | ' + data.id), 400);
        slide.insertImage(blob, qrShape.getLeft(), qrShape.getTop(), qrShape.getWidth(), qrShape.getHeight());
        qrShape.remove();
      } catch (err) {
        console.warn('QR skipped: ' + err);
        qrShape.getText().setText(data.id);
      }
    }

    pres.saveAndClose();
    const pdf = folder.createFile(copy.getAs(MimeType.PDF).setName(fileBase + '.pdf'));
    if (CONFIG.SHARE_PDF_WITH_LINK) {
      try { pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
      catch (err) { console.warn('Sharing blocked by domain policy: ' + err); }
    }
    return pdf;
  } finally {
    copy.setTrashed(true); // temporary Slides copy → Trash (not permanently deleted)
  }
}

/**
 * Builds the certificate template in Google Slides (A4 landscape).
 * You can later redesign it freely in Slides (or set your own designed image
 * as background) – just keep the {{PLACEHOLDERS}}.
 */
function createCertificateTemplate_() {
  const title = 'JIJA TRF – Certificate Template';
  let presId;
  try {
    // Advanced Slides service lets us set A4 landscape (842 × 595 pt).
    presId = Slides.Presentations.create({
      title: title,
      pageSize: { width: { magnitude: 842, unit: 'PT' }, height: { magnitude: 595, unit: 'PT' } },
    }).presentationId;
  } catch (err) {
    console.warn('Advanced Slides service unavailable, using 16:9: ' + err);
    presId = SlidesApp.create(title).getId();
  }

  const pres = SlidesApp.openById(presId);
  let slide = pres.getSlides()[0] || pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getPageElements().forEach(el => el.remove());

  const sx = pres.getPageWidth() / 842, sy = pres.getPageHeight() / 595, sf = Math.min(sx, sy);
  const P = SlidesApp.ParagraphAlignment;
  const rect = (x, y, w, h, fill, border, weight, round) => {
    const s = slide.insertShape(round ? SlidesApp.ShapeType.ROUND_RECTANGLE : SlidesApp.ShapeType.RECTANGLE,
      x * sx, y * sy, w * sx, h * sy);
    if (fill) s.getFill().setSolidFill(fill); else s.getFill().setTransparent();
    if (border) s.getBorder().setWeight(weight || 1).getLineFill().setSolidFill(border);
    else s.getBorder().setTransparent();
    return s;
  };
  const text = (str, x, y, w, h, o) => {
    o = o || {};
    const s = slide.insertTextBox(str, x * sx, y * sy, w * sx, h * sy);
    styleText_(s, o, sf);
    return s;
  };
  const line = (x1, y1, x2, y2, color, weight) => {
    slide.insertLine(SlidesApp.LineCategory.STRAIGHT, x1 * sx, y1 * sy, x2 * sx, y2 * sy)
      .setWeight(weight || 1).getLineFill().setSolidFill(color);
  };

  slide.getBackground().setSolidFill(COLORS.cream);

  // Borders
  rect(8, 8, 826, 579, null, COLORS.green, 7);
  rect(20, 20, 802, 555, null, COLORS.gold, 1.5);

  // Brand (top-left)
  text('JIJA', 36, 30, 190, 44, { size: 36, bold: true, color: COLORS.green, font: 'Poppins', align: P.START });
  text('TEXTILE RECOVERY FACILITY – PANVEL', 36, 74, 220, 16, { size: 9, bold: true, color: COLORS.green, font: 'Poppins', align: P.START });
  text('Recover • Reuse • Recycle • Rebuild', 36, 90, 220, 14, { size: 8.5, italic: true, color: COLORS.leaf, align: P.START });

  // Tagline (top-right)
  text('Waste to Value.\nWomen to Opportunity.', 600, 32, 206, 38, { size: 11, italic: true, bold: true, color: COLORS.green2, font: 'Poppins', align: P.END });
  text('♻ ZERO TEXTILE WASTE', 600, 74, 206, 18, { size: 10, bold: true, color: COLORS.green, font: 'Poppins', align: P.END });

  // Title
  const banner = rect(256, 32, 330, 38, COLORS.green, COLORS.gold, 2);
  banner.getText().setText('TEXTILE DONATION');
  styleText_(banner, { size: 20, bold: true, color: COLORS.white, font: 'Poppins' }, sf);
  text('CERTIFICATE', 256, 72, 330, 34, { size: 28, bold: true, color: COLORS.green, font: 'Playfair Display' });
  text('वस्त्र दान प्रमाणपत्र', 256, 106, 330, 22, { size: 14, bold: true, color: COLORS.navy, font: 'Mukta' });

  // Certificate no. / date
  text('Certificate No.:  {{DONATION_ID}}', 40, 134, 300, 18, { size: 10, bold: true, color: COLORS.text, align: P.START });
  text('Date:  {{DONATION_DATE}}', 542, 134, 260, 18, { size: 10, bold: true, color: COLORS.text, align: P.END });

  // Presented to
  text('This certificate is proudly presented to', 121, 158, 600, 18, { size: 12, italic: true, color: COLORS.muted });
  text('{{DONOR_NAME}}', 81, 176, 680, 40, { size: 30, bold: true, color: COLORS.green, font: 'Playfair Display' });
  line(231, 218, 611, 218, COLORS.gold, 1.5);
  text('{{ORGANIZATION}}', 121, 220, 600, 16, { size: 10.5, bold: true, color: COLORS.navy });

  // Weight (hero number)
  text('in recognition of the valuable contribution of', 121, 240, 600, 16, { size: 11, color: COLORS.text });
  const pill = rect(331, 258, 180, 36, COLORS.mint, COLORS.green2, 1.5, true);
  pill.getText().setText('{{WEIGHT}} KG');
  styleText_(pill, { size: 22, bold: true, color: COLORS.green, font: 'Poppins' }, sf);
  text('of textile materials to ' + CONFIG.ORG_NAME + ' for responsible', 81, 298, 680, 16, { size: 11, color: COLORS.text });
  text('REUSE  •  REPAIR  •  UPCYCLE  •  RECYCLE  •  RECOVER', 81, 316, 680, 18, { size: 12, bold: true, color: COLORS.green2, font: 'Poppins' });

  // Donation details box
  rect(48, 346, 470, 128, COLORS.mint, COLORS.mintBorder, 1, true);
  const head = rect(48, 346, 470, 22, COLORS.green, null);
  head.getText().setText('  Donation Details');
  styleText_(head, { size: 10.5, bold: true, color: COLORS.white, font: 'Poppins', align: P.START }, sf);
  text('Donation ID\nType of Textile\nItems / Footwear\nCollection Location',
    58, 374, 130, 94, { size: 9.5, bold: true, color: COLORS.text, align: P.START, middle: false, spacing: 150 });
  text(':  {{DONATION_ID}}\n:  {{TEXTILE_TYPE}}\n:  {{ITEMS}} items  |  {{FOOTWEAR}} pairs footwear\n:  {{LOCATION}}',
    186, 374, 326, 94, { size: 9.5, color: COLORS.text, align: P.START, middle: false, spacing: 150 });

  // QR + ID
  const qr = rect(548, 350, 92, 92, COLORS.white, COLORS.mintBorder, 1);
  qr.getText().setText('{{QR}}');
  styleText_(qr, { size: 8, color: COLORS.muted }, sf);
  text('Scan to verify', 528, 442, 132, 14, { size: 8, italic: true, color: COLORS.muted });
  text('{{DONATION_ID}}', 520, 456, 148, 18, { size: 11, bold: true, color: COLORS.green, font: 'Poppins' });

  // Signatory
  line(680, 432, 806, 432, COLORS.text, 0.8);
  text('{{SIGNATORY_NAME}}', 668, 410, 150, 18, { size: 9.5, bold: true, color: COLORS.text });
  text('{{SIGNATORY_DESIGNATION}}', 668, 434, 150, 14, { size: 9, bold: true, color: COLORS.text });
  text('For ' + CONFIG.ORG_NAME, 662, 448, 162, 26, { size: 7.5, color: COLORS.muted });

  // Quote
  text('“Don’t throw textile waste. Recover it!”  —  Together for a Cleaner & Greener Panvel', 48, 482, 746, 20,
    { size: 11, italic: true, bold: true, color: COLORS.green2 });

  // Footer band
  const foot = rect(20, 510, 802, 65, COLORS.green, null);
  foot.getText().setText(
    'Environmental Protection  •  Textile Recovery  •  Resource Conservation  •  Community Development\n' +
    'Tel: ' + CONFIG.PHONE + '   |   ' + CONFIG.WEBSITE + '   |   ' + CONFIG.EMAIL + '   |   ' + CONFIG.ADDRESS);
  styleText_(foot, { size: 9, color: COLORS.white, font: 'Poppins', spacing: 140 }, sf);

  pres.saveAndClose();
  return presId;
}

function styleText_(shape, o, sf) {
  const t = shape.getText();
  t.getTextStyle()
    .setFontFamily(o.font || 'Open Sans')
    .setFontSize((o.size || 11) * sf)
    .setBold(!!o.bold)
    .setItalic(!!o.italic)
    .setForegroundColor(o.color || COLORS.text);
  const ps = t.getParagraphStyle().setParagraphAlignment(o.align || SlidesApp.ParagraphAlignment.CENTER);
  if (o.spacing) ps.setLineSpacing(o.spacing);
  shape.setContentAlignment(o.middle === false ? SlidesApp.ContentAlignment.TOP : SlidesApp.ContentAlignment.MIDDLE);
}

// ========================= EMAIL / WHATSAPP =========================
function sendCertificateEmail_(data, pdfFile) {
  if (!CONFIG.SEND_EMAIL) return 'Email disabled';
  if (!data.email) return 'No email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Invalid email';
  if (MailApp.getRemainingDailyQuota() < 1) return 'Quota exhausted – retry tomorrow';

  const html =
    '<div style="font-family:Arial,sans-serif;color:#263238;max-width:560px">' +
    '<h2 style="color:#1B5E20;margin:0 0 8px">Thank you, ' + esc_(data.name) + '! 🌿</h2>' +
    '<p>Your donation of <b>' + esc_(data.weightText) + ' KG</b> of textiles has been received by <b>' +
    esc_(CONFIG.ORG_NAME) + '</b>.</p>' +
    '<p>Donation ID: <b>' + esc_(data.id) + '</b><br>Date: ' + esc_(data.dateText) + '</p>' +
    '<p>Your <b>Certificate of Textile Donation</b> is attached (PDF).</p>' +
    (data.verifyUrl ? '<p><a href="' + esc_(data.verifyUrl) + '">Verify this certificate online</a></p>' : '') +
    '<p style="color:#2E7D32"><i>Don’t throw textile waste. Recover it! ♻️</i></p>' +
    '<p style="font-size:12px;color:#607D8B">' + esc_(CONFIG.ORG_NAME) + ' · ' + esc_(CONFIG.PHONE) +
    ' · ' + esc_(CONFIG.WEBSITE) + '</p></div>';

  MailApp.sendEmail({
    to: data.email,
    subject: 'Your Textile Donation Certificate – ' + data.id,
    htmlBody: html,
    name: CONFIG.ORG_SHORT,
    replyTo: CONFIG.EMAIL,
    attachments: [pdfFile.getBlob()],
  });
  return 'Sent';
}

/** Click-to-chat link (free, no API). Volunteer taps it → WhatsApp opens with message ready. */
function whatsappLink_(data, pdfUrl) {
  if (data.mobile.length !== 10) return '';
  const msg = 'Namaskar ' + data.name + ' 🙏\n' +
    'Thank you for donating ' + data.weightText + ' KG of textiles to ' + CONFIG.ORG_SHORT + '.\n' +
    'Donation ID: ' + data.id + '\nYour certificate: ' + pdfUrl + '\n♻️ Zero Textile Waste Panvel';
  return 'https://wa.me/91' + data.mobile + '?text=' + encodeURIComponent(msg);
}

// ========================= QR CODES =========================
function qrBlob_(text, size) {
  const url = 'https://quickchart.io/qr?margin=1&size=' + size + '&ecLevel=M&text=' + encodeURIComponent(text);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('QR service HTTP ' + res.getResponseCode());
  return res.getBlob().setName('qr.png');
}

/** One QR for the general form + one pre-filled QR per camp (camp auto-selected). */
function generateCampQRCodes(silent) {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const folder = DriveApp.getFolderById(props.getProperty('QR_FOLDER_ID'));
  const ss = getSs_();
  const sheet = ss.getSheetByName(CONFIG.CAMP_QR_SHEET) || ss.insertSheet(CONFIG.CAMP_QR_SHEET);
  sheet.clear();
  const rows = [['Camp / Purpose', 'Form Link', 'QR Image (Drive)']];

  const shorten = u => { try { return form.shortenFormUrl(u); } catch (e) { return u; } };
  const saveQr = (label, url) => {
    const name = 'QR – ' + label.replace(/[\\/:*?"<>|]/g, '') + '.png';
    const old = folder.getFilesByName(name);
    while (old.hasNext()) old.next().setTrashed(true);
    const file = folder.createFile(qrBlob_(url, 800).setName(name));
    rows.push([label, url, file.getUrl()]);
  };

  saveQr('General Registration (all camps)', shorten(form.getPublishedUrl()));
  const campItem = form.getItems().filter(i => i.getTitle() === Q.CAMP)[0];
  if (campItem) {
    const mc = campItem.asMultipleChoiceItem();
    CONFIG.CAMPS.forEach(camp => {
      const url = form.createResponse().withItemResponse(mc.createResponse(camp)).toPrefilledUrl();
      saveQr(camp, shorten(url));
    });
  }
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground(COLORS.green).setFontColor(COLORS.white);
  sheet.setColumnWidth(1, 340); sheet.setColumnWidth(2, 380); sheet.setColumnWidth(3, 380);
  if (silent !== true) toast_('QR codes saved in Drive → ' + CONFIG.ROOT_FOLDER + ' / QR Codes');
}

// ========================= DASHBOARD =========================
function refreshDashboard() {
  const ss = getSs_();
  const src = getResponseSheet_();
  const values = src.getDataRange().getValues();
  const headers = values.shift() || [];
  const idx = {};
  headers.forEach((h, i) => { idx[norm_(h)] = i; });
  const g = (r, title) => { const i = idx[norm_(title)]; return i === undefined ? '' : r[i]; };

  const rows = values.filter(r => String(g(r, Q.NAME)).trim());
  const donors = {}, camps = {}, orgs = {}, types = {}, months = {};
  let kg = 0, items = 0, pairs = 0, certs = 0, emails = 0;

  rows.forEach(r => {
    const w = toNumber_(g(r, Q.WEIGHT)), it = toNumber_(g(r, Q.ITEMS)), fp = toNumber_(g(r, Q.FOOTWEAR));
    kg += w; items += it; pairs += fp;
    if (g(r, SYS.STATUS) === 'Generated') certs++;
    if (g(r, SYS.EMAIL_STATUS) === 'Sent') emails++;
    const mob = String(g(r, Q.MOBILE)).replace(/\D/g, '').slice(-10);
    donors[mob || String(g(r, Q.NAME)).trim().toLowerCase()] = 1;

    const add = (bucket, key) => {
      const b = bucket[key] || (bucket[key] = { n: 0, kg: 0, pairs: 0 });
      b.n++; b.kg += w; b.pairs += fp;
    };
    add(camps, String(g(r, Q.CAMP)).trim() || 'Not specified');
    const org = cleanName_(g(r, Q.ORG));
    if (org) add(orgs, org);
    String(g(r, Q.TEXTILE)).split(',').map(s => s.trim()).filter(String)
      .forEach(t => { types[t] = (types[t] || 0) + 1; });
    const d = g(r, Q.DATE) instanceof Date ? g(r, Q.DATE) : g(r, 'Timestamp');
    if (d instanceof Date) add(months, Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM'));
  });

  const dash = ss.getSheetByName(CONFIG.DASHBOARD_SHEET) || ss.insertSheet(CONFIG.DASHBOARD_SHEET, 0);
  dash.clear();
  dash.getRange('A1').setValue('JIJA TRF Panvel – Textile Donation Dashboard')
    .setFontSize(16).setFontWeight('bold').setFontColor(COLORS.green);
  dash.getRange('A2').setValue('Updated: ' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'))
    .setFontColor(COLORS.muted);

  const kpis = [
    ['Total Donations', 'Unique Donors', 'Total KG', 'Total Items', 'Footwear Pairs', 'Certificates', 'Emails Sent'],
    [rows.length, Object.keys(donors).length, round2_(kg), items, pairs, certs, emails],
  ];
  dash.getRange(4, 1, 2, 7).setValues(kpis);
  styleHeader_(dash.getRange(4, 1, 1, 7));
  dash.getRange(5, 1, 1, 7).setFontSize(18).setFontWeight('bold').setFontColor(COLORS.green)
    .setHorizontalAlignment('center').setBackground(COLORS.mint);

  const table = (row, col, title, head, obj, sortKey) => {
    const keys = Object.keys(obj).sort(sortKey || ((a, b) => obj[b].kg - obj[a].kg));
    const data = [head].concat(keys.map(k => [k, obj[k].n, round2_(obj[k].kg), obj[k].pairs]));
    dash.getRange(row - 1, col).setValue(title).setFontWeight('bold').setFontColor(COLORS.green);
    dash.getRange(row, col, data.length, 4).setValues(data);
    styleHeader_(dash.getRange(row, col, 1, 4));
    return row + data.length + 2;
  };

  let r = 9;
  r = Math.max(
    table(r, 1, 'Camp-wise Collection', ['Camp / Location', 'Donations', 'KG', 'Footwear Pairs'], camps),
    table(r, 6, 'Society / Organization-wise Collection', ['Organization', 'Donations', 'KG', 'Footwear Pairs'], orgs)
  );
  table(r, 1, 'Month-wise Collection', ['Month', 'Donations', 'KG', 'Footwear Pairs'], months, (a, b) => a < b ? -1 : 1);

  const typeRows = [['Textile Type', 'Donations']].concat(
    Object.keys(types).sort((a, b) => types[b] - types[a]).map(k => [k, types[k]]));
  dash.getRange(r - 1, 6).setValue('Textile Type Mix').setFontWeight('bold').setFontColor(COLORS.green);
  dash.getRange(r, 6, typeRows.length, 2).setValues(typeRows);
  styleHeader_(dash.getRange(r, 6, 1, 2));

  dash.setColumnWidth(1, 300); dash.setColumnWidth(6, 300);
  [2, 3, 4, 5, 7, 8, 9].forEach(c => dash.setColumnWidth(c, 120));
  dash.setFrozenRows(2);
}

function styleHeader_(range) {
  range.setFontWeight('bold').setBackground(COLORS.green).setFontColor(COLORS.white).setHorizontalAlignment('center');
}

// ========================= VERIFY WEB APP =========================
/** Deploy → New deployment → Web app (Execute as: Me, Access: Anyone). */
function doGet(e) {
  const id = String((e && e.parameter && e.parameter.id) || '').trim().toUpperCase();
  const t = HtmlService.createTemplateFromFile('Verify');
  t.id = id;
  t.result = /^[A-Z]+-\d{4}-\d+$/.test(id) ? lookupDonation_(id) : null;
  t.org = { name: CONFIG.ORG_NAME, phone: CONFIG.PHONE, web: CONFIG.WEBSITE };
  t.selfUrl = CONFIG.VERIFY_URL || ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle('Certificate Verification – ' + CONFIG.ORG_SHORT)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Returns only public, non-sensitive fields (no mobile / email / address). */
function lookupDonation_(id) {
  const sheet = getResponseSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(norm_);
  const c = t => headers.indexOf(norm_(t));
  const row = values.find(r => String(r[c(SYS.ID)]).trim().toUpperCase() === id);
  if (!row) return null;
  return {
    id: id,
    name: cleanName_(row[c(Q.NAME)]),
    org: cleanName_(row[c(Q.ORG)]),
    kg: fmtNum_(toNumber_(row[c(Q.WEIGHT)])),
    date: fmtDate_(row[c(Q.DATE)] || row[c('Timestamp')]),
    location: String(row[c(Q.CAMP)] || ''),
    valid: row[c(SYS.STATUS)] === 'Generated',
  };
}

function verifyUrlFor_(id) {
  let base = CONFIG.VERIFY_URL;
  if (!base) { try { base = ScriptApp.getService().getUrl() || ''; } catch (e) { base = ''; } }
  return base ? base + '?id=' + encodeURIComponent(id) : '';
}

// ========================= HELPERS =========================
function getSs_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function getResponseSheet_() {
  const ss = getSs_();
  const gid = PropertiesService.getScriptProperties().getProperty('RESPONSE_SHEET_GID');
  const byGid = gid ? ss.getSheets().find(s => String(s.getSheetId()) === gid) : null;
  const sheet = byGid || ss.getSheetByName(CONFIG.RESPONSE_SHEET);
  if (!sheet) throw new Error('Response sheet not found. Run "JIJA TRF → 1. Setup System".');
  return sheet;
}

/** Adds any missing system columns; returns {normalizedHeader: columnNumber}. */
function ensureSystemColumns_(sheet) {
  let lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const cols = {};
  headers.forEach((h, i) => { if (String(h).trim()) cols[norm_(h)] = i + 1; });
  Object.keys(SYS).forEach(k => {
    const title = SYS[k];
    if (cols[norm_(title)]) return;
    lastCol = String(sheet.getRange(1, lastCol).getValue()).trim() ? lastCol + 1 : lastCol;
    if (lastCol > sheet.getMaxColumns()) sheet.insertColumnAfter(sheet.getMaxColumns());
    sheet.getRange(1, lastCol).setValue(title)
      .setFontWeight('bold').setBackground(COLORS.navy).setFontColor(COLORS.white);
    cols[norm_(title)] = lastCol;
  });
  return cols;
}

function readRow_(sheet, row, cols) {
  const width = Math.max.apply(null, Object.keys(cols).map(k => cols[k]));
  const vals = sheet.getRange(row, 1, 1, width).getValues()[0];
  return { get: title => { const c = cols[norm_(title)]; return c ? vals[c - 1] : ''; } };
}

function setCell_(sheet, row, cols, title, value) {
  const c = cols[norm_(title)];
  if (c) sheet.getRange(row, c).setValue(value);
}

function norm_(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

/** Trims, collapses spaces, strips control chars and placeholder braces, caps length. */
function cleanName_(v) {
  return String(v || '').replace(/[\u0000-\u001F{}<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function toNumber_(v) {
  const n = parseFloat(String(v === null || v === undefined ? '' : v).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
}

function round2_(n) { return Math.round(n * 100) / 100; }
function fmtNum_(n) { return String(round2_(n)); }

function fmtDate_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, CONFIG.TIMEZONE, 'dd/MM/yyyy');
  return String(v || '').trim() || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy');
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function getOrCreateFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function getYearFolder_(year) {
  const parent = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('CERT_FOLDER_ID'));
  return getOrCreateFolder_(parent, String(year));
}

function fileExists_(id) {
  if (!id) return false;
  try { return !DriveApp.getFileById(id).isTrashed(); } catch (e) { return false; }
}

function toast_(msg) {
  try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, CONFIG.ORG_SHORT, 6); } catch (e) { console.log(msg); }
}

function showLinks() {
  const p = PropertiesService.getScriptProperties();
  const form = p.getProperty('FORM_ID') ? FormApp.openById(p.getProperty('FORM_ID')) : null;
  const lines = [
    '✅ System ready!',
    '',
    'Donor Form (share / QR): ' + (form ? form.getPublishedUrl() : '-'),
    'Form editor: ' + (form ? form.getEditUrl() : '-'),
    'Certificate template (Slides): https://docs.google.com/presentation/d/' + p.getProperty('TEMPLATE_ID') + '/edit',
    'Drive folder: https://drive.google.com/drive/folders/' + p.getProperty('ROOT_FOLDER_ID'),
    'Verify web app: ' + (CONFIG.VERIFY_URL || 'not set – Deploy as Web app, then paste URL in CONFIG.VERIFY_URL'),
    '',
    'QR codes: see the "' + CONFIG.CAMP_QR_SHEET + '" sheet.',
  ];
  try {
    SpreadsheetApp.getUi().alert(lines.join('\n'));
  } catch (e) { console.log(lines.join('\n')); }
}
