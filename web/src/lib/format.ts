import { ORG } from "./config";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function fmtKg(n: number) {
  return String(round2(n));
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function fmtDate(d: string) {
  const [y, m, dd] = String(d).slice(0, 10).split("-");
  return dd ? `${dd}/${m}/${y}` : d;
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: ORG.timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Today in India as YYYY-MM-DD. */
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ORG.timezone }).format(new Date());
}

export function daysAgoIST(days: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ORG.timezone }).format(new Date(Date.now() - days * 864e5));
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function whatsappLink(d: { mobile: string; donorName: string; weightKg: number; id: string }, certUrl: string) {
  const m = String(d.mobile).replace(/\D/g, "").slice(-10);
  const msg =
    `Namaskar ${d.donorName} 🙏\n` +
    `Thank you for donating ${fmtKg(d.weightKg)} KG of textiles to ${ORG.short}.\n` +
    `Donation ID: ${d.id}\nYour certificate: ${certUrl}\n♻️ Zero Textile Waste Panvel`;
  return (m.length === 10 ? `https://wa.me/91${m}` : "https://wa.me/") + "?text=" + encodeURIComponent(msg);
}
