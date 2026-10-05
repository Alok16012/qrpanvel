import type { Metadata } from "next";
import Link from "next/link";
import { HBars, MonthColumns } from "@/components/Charts";
import { store } from "@/lib/db";
import { daysAgoIST, fmtDate, fmtKg } from "@/lib/format";
import { computeStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Dashboard" };

const RANGES = { all: "All time", "30d": "Last 30 days", "90d": "Last 90 days" } as const;

export default async function Dashboard(props: PageProps<"/admin">) {
  const { range: r } = await props.searchParams;
  const range = (typeof r === "string" && r in RANGES ? r : "all") as keyof typeof RANGES;
  let rows = await store.listDonations();
  if (range !== "all") {
    const days = range === "30d" ? 30 : 90;
    const since = daysAgoIST(days);
    rows = rows.filter((d) => d.donationDate >= since);
  }
  const s = computeStats(rows);
  const recent = rows.filter((d) => d.status === "issued").slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold text-g">Textile Donation Dashboard</h1>
          <p className="text-sm text-muted">Live from every form submission and offline entry</p>
        </div>
        <div className="flex rounded-lg border border-line bg-white p-1 text-sm font-semibold">
          {Object.entries(RANGES).map(([k, label]) => (
            <Link
              key={k}
              href={k === "all" ? "/admin" : `/admin?range=${k}`}
              className={`rounded-md px-3 py-1.5 ${range === k ? "bg-g2 text-white" : "text-muted hover:text-g"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total KG" value={fmtKg(s.kg)} accent />
        <Kpi label="Donations" value={s.donations} />
        <Kpi label="Unique donors" value={s.donors} />
        <Kpi label="Items" value={s.items.toLocaleString("en-IN")} />
        <Kpi label="Footwear pairs" value={s.pairs} />
        <Kpi label="Avg KG / donation" value={s.avgKg} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Month-wise collection (KG)" className="xl:col-span-2">
          <MonthColumns data={s.byMonth} />
        </Panel>
        <Panel title="Donor type (KG)">
          <HBars data={s.byType} />
        </Panel>
        <Panel title="Camp-wise collection (KG)">
          <HBars data={s.byCamp} />
        </Panel>
        <Panel title="Society / organization-wise (KG)">
          <HBars data={s.byOrg} />
        </Panel>
        <Panel title="Textile type mix (donations)">
          <HBars data={s.byTextile} metric="n" unit="" />
        </Panel>
      </div>

      <Panel
        title="Recent donations"
        className="mt-4"
        action={
          <Link href="/admin/donations" className="text-sm font-semibold text-g2 hover:underline">
            View all →
          </Link>
        }
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted uppercase">
              <tr className="[&_th]:px-2 [&_th]:pb-2">
                <th>ID</th>
                <th>Donor</th>
                <th>Camp</th>
                <th className="text-right">KG</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d) => (
                <tr key={d.id} className="border-t border-line [&_td]:px-2 [&_td]:py-2.5">
                  <td>
                    <Link href={`/certificate/${d.id}`} target="_blank" className="font-head font-semibold text-g2 hover:underline">
                      {d.id}
                    </Link>
                  </td>
                  <td className="font-semibold">{d.donorName}</td>
                  <td className="max-w-64 truncate text-muted">{d.camp}</td>
                  <td className="text-right font-bold tabular-nums">{fmtKg(d.weightKg)}</td>
                  <td className="text-muted">{fmtDate(d.donationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-g bg-g text-white" : "border-line bg-white"}`}>
      <div className={`text-xs font-bold uppercase ${accent ? "text-white/75" : "text-muted"}`}>{label}</div>
      <div className={`mt-1 font-head text-3xl font-bold tabular-nums ${accent ? "text-gold" : "text-g"}`}>{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-head text-[15px] font-semibold text-g">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
