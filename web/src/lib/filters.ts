import type { Donation } from "./types";

export interface DonationFilter {
  q?: string;
  camp?: string;
  status?: string;
}

export function readFilter(sp: Record<string, string | string[] | undefined>): DonationFilter {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  return { q: one("q"), camp: one("camp"), status: one("status") };
}

export function applyFilter(rows: Donation[], f: DonationFilter) {
  const q = f.q?.toLowerCase();
  return rows.filter(
    (d) =>
      (!f.camp || d.camp === f.camp) &&
      (!f.status || d.status === f.status) &&
      (!q ||
        [d.id, d.donorName, d.organization, d.mobile, d.email].some((v) => v.toLowerCase().includes(q))),
  );
}
