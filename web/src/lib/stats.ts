import { round2 } from "./format";
import type { Donation } from "./types";

export interface Bucket {
  key: string;
  n: number;
  kg: number;
  pairs: number;
}

function group(rows: Donation[], keyOf: (d: Donation) => string | string[]) {
  const map = new Map<string, Bucket>();
  for (const d of rows) {
    const keys = keyOf(d);
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      if (!key) continue;
      const b = map.get(key) ?? { key, n: 0, kg: 0, pairs: 0 };
      b.n++;
      b.kg = round2(b.kg + d.weightKg);
      b.pairs += d.footwearPairs;
      map.set(key, b);
    }
  }
  return [...map.values()];
}

export function computeStats(all: Donation[]) {
  const rows = all.filter((d) => d.status === "issued");
  const kg = round2(rows.reduce((s, d) => s + d.weightKg, 0));
  return {
    donations: rows.length,
    donors: new Set(rows.map((d) => d.mobile)).size,
    kg,
    items: rows.reduce((s, d) => s + d.items, 0),
    pairs: rows.reduce((s, d) => s + d.footwearPairs, 0),
    avgKg: rows.length ? round2(kg / rows.length) : 0,
    voided: all.length - rows.length,
    emails: rows.filter((d) => d.email).length,
    byCamp: group(rows, (d) => d.camp).sort((a, b) => b.kg - a.kg),
    byOrg: group(rows, (d) => d.organization).sort((a, b) => b.kg - a.kg),
    byType: group(rows, (d) => d.donorType).sort((a, b) => b.kg - a.kg),
    byTextile: group(rows, (d) => d.textileTypes).sort((a, b) => b.n - a.n),
    byMonth: group(rows, (d) => d.donationDate.slice(0, 7)).sort((a, b) => a.key.localeCompare(b.key)),
  };
}
