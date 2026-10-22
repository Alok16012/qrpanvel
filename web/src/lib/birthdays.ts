import "server-only";
import { ORG } from "./config";
import { todayIST } from "./format";
import type { Donation } from "./types";
import { store } from "./db";
import { birthdayEmail, emailConfigured, sendEmail } from "./email";

export interface BirthdayDonor {
  donorName: string;
  mobile: string;
  email: string;
  birthday: string; // YYYY-MM-DD
  lastDonationId: string;
  /** Next birthday as YYYY-MM-DD (today or later). */
  next: string;
  daysUntil: number;
  turning: number;
}

/** One entry per donor (by mobile), with the next upcoming birthday. */
export function birthdayList(rows: Donation[], today = todayIST()): BirthdayDonor[] {
  const seen = new Map<string, BirthdayDonor>();
  const year = Number(today.slice(0, 4));
  const todayMs = Date.parse(today);
  for (const d of rows) {
    if (d.status !== "issued" || !d.birthday || seen.has(d.mobile)) continue; // rows are newest-first
    const [by, bm, bd] = d.birthday.split("-").map(Number);
    let next = new Date(Date.UTC(year, bm - 1, bd));
    if (next.toISOString().slice(0, 10) < today) next = new Date(Date.UTC(year + 1, bm - 1, bd));
    const nextStr = next.toISOString().slice(0, 10);
    seen.set(d.mobile, {
      donorName: d.donorName,
      mobile: d.mobile,
      email: d.email,
      birthday: d.birthday,
      lastDonationId: d.id,
      next: nextStr,
      daysUntil: Math.round((Date.parse(nextStr) - todayMs) / 864e5),
      turning: Number(nextStr.slice(0, 4)) - by,
    });
  }
  return [...seen.values()].sort((a, b) => a.daysUntil - b.daysUntil || a.donorName.localeCompare(b.donorName));
}

export function birthdayMessage(name: string) {
  return (
    `🎂 Happy Birthday, ${name}! 🎉\n\n` +
    `${ORG.name} wishes you a very happy birthday and a wonderful year ahead. ` +
    `Thank you for being part of our Zero Textile Waste mission — your old clothes are giving someone a new start. ♻️\n\n` +
    `With gratitude,\nTeam JIJA TRF Panvel\n📞 ${ORG.phone} · ${ORG.website}`
  );
}

/** Click-to-chat link with the wish ready to send (no API needed). */
export function birthdayWhatsappLink(d: { mobile: string; donorName: string }) {
  return `https://wa.me/91${d.mobile}?text=${encodeURIComponent(birthdayMessage(d.donorName))}`;
}

export interface WishResult {
  date: string;
  emailConfigured: boolean;
  donors: { donorName: string; mobile: string; email: string; emailStatus: string; whatsapp: string }[];
}

/**
 * Sends today's birthday wishes by email (when RESEND_API_KEY is set) and
 * returns the list – including the WhatsApp links for a volunteer to tap.
 * Called by the daily cron (/api/birthdays) and by the admin "Send now" button.
 */
export async function sendTodaysBirthdayWishes(): Promise<WishResult> {
  const date = todayIST();
  const todays = birthdayList(await store.listDonations(), date).filter((b) => b.daysUntil === 0);
  const configured = emailConfigured();
  const donors: WishResult["donors"] = [];
  for (const b of todays) {
    let emailStatus = "No email";
    if (b.email) {
      if (!configured) emailStatus = "Not sent – email not configured";
      else {
        const r = await sendEmail({ to: b.email, ...birthdayEmail(b.donorName, birthdayMessage(b.donorName)) });
        emailStatus = r.ok ? "Sent" : `Failed: ${r.error}`;
      }
    }
    donors.push({ donorName: b.donorName, mobile: b.mobile, email: b.email, emailStatus, whatsapp: birthdayWhatsappLink(b) });
  }
  return { date, emailConfigured: configured, donors };
}
