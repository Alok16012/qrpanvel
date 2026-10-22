import "server-only";
import { ORG } from "./config";

/**
 * Transactional email via Resend's REST API (no SDK needed).
 * Set RESEND_API_KEY (+ optional EMAIL_FROM) to switch it on; without a key
 * every send returns { ok: false } and the app keeps working in demo mode.
 */
export const emailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email not configured (RESEND_API_KEY missing)" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${ORG.short} <onboarding@resend.dev>`,
        to: [msg.to],
        reply_to: ORG.email,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: body.message || `HTTP ${res.status}` };
    return { ok: true, id: body.id ?? "" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const shell = (inner: string) =>
  `<div style="font-family:Arial,sans-serif;color:#263238;max-width:560px;margin:0 auto">` +
  `<div style="background:#1B5E20;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0">` +
  `<b style="font-size:18px">♻ JIJA TRF PANVEL</b><br><span style="font-size:12px;opacity:.85">Textile Recovery Facility</span></div>` +
  `<div style="border:1px solid #DFE7DC;border-top:0;padding:20px;border-radius:0 0 12px 12px">${inner}` +
  `<p style="font-size:12px;color:#607D8B;margin-top:24px">${esc(ORG.name)} · ${esc(ORG.phone)} · ${esc(ORG.website)} · ${esc(ORG.email)}</p></div></div>`;

export function certificateEmail(d: { donorName: string; weightKg: number; id: string; donationDate: string }, certUrl: string, verifyUrl: string) {
  return {
    subject: `Your Textile Donation Certificate – ${d.id}`,
    html: shell(
      `<h2 style="color:#1B5E20;margin:0 0 8px">Thank you, ${esc(d.donorName)}! 🌿</h2>` +
        `<p>Your donation of <b>${d.weightKg} KG</b> of textiles has been received by <b>${esc(ORG.name)}</b>.</p>` +
        `<p>Donation ID: <b>${esc(d.id)}</b></p>` +
        `<p><a href="${esc(certUrl)}" style="display:inline-block;background:#2E7D32;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open your certificate (PDF download inside)</a></p>` +
        `<p style="font-size:13px">Verify any time: <a href="${esc(verifyUrl)}">${esc(verifyUrl)}</a></p>` +
        `<p style="color:#2E7D32"><i>Don’t throw textile waste. Recover it! ♻️</i></p>`,
    ),
    text:
      `Thank you, ${d.donorName}!\nYour donation of ${d.weightKg} KG of textiles has been received by ${ORG.name}.\n` +
      `Donation ID: ${d.id}\nCertificate: ${certUrl}\nVerify: ${verifyUrl}\n\n${ORG.name} · ${ORG.phone}`,
  };
}

export function birthdayEmail(donorName: string, message: string) {
  return {
    subject: `🎂 Happy Birthday, ${donorName}! – from JIJA TRF Panvel`,
    html: shell(
      `<h2 style="color:#1B5E20;margin:0 0 8px">Happy Birthday, ${esc(donorName)}! 🎉</h2>` +
        `<p style="white-space:pre-line">${esc(message)}</p>`,
    ),
    text: message,
  };
}
