import { monthLabel } from "@/lib/format";
import type { Bucket } from "@/lib/stats";

export function HBars({ data, metric = "kg", unit = " kg", limit = 8 }: { data: Bucket[]; metric?: "kg" | "n"; unit?: string; limit?: number }) {
  const rows = data.slice(0, limit);
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">No data yet</p>;
  const max = Math.max(...rows.map((r) => r[metric]), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate" title={r.key}>
              {r.key}
            </span>
            <b className="shrink-0 font-head tabular-nums text-g">
              {r[metric]}
              {unit}
            </b>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-mint">
            <div className="h-full rounded-full bg-g2" style={{ width: `${(r[metric] / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Monthly KG columns. */
export function MonthColumns({ data }: { data: Bucket[] }) {
  if (!data.length) return <p className="py-6 text-center text-sm text-muted">No data yet</p>;
  const max = Math.max(...data.map((d) => d.kg), 1);
  return (
    <div className="flex h-56 items-end gap-2 sm:gap-4">
      {data.map((d) => (
        <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="font-head text-xs font-semibold tabular-nums text-g">{d.kg}</span>
          <div
            className="w-full max-w-14 rounded-t-md bg-g2 transition group-hover:bg-g"
            style={{ height: `${Math.max(2, (d.kg / max) * 78)}%` }}
            title={`${monthLabel(d.key)}: ${d.kg} kg · ${d.n} donations`}
          />
          <span className="text-xs whitespace-nowrap text-muted">{monthLabel(d.key)}</span>
        </div>
      ))}
    </div>
  );
}
