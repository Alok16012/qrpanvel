import type { Metadata } from "next";
import Link from "next/link";
import { store } from "@/lib/db";
import { applyFilter, readFilter } from "@/lib/filters";
import { fmtDate, fmtDateTime, fmtKg, round2, whatsappLink } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { StatusToggle } from "./StatusToggle";

export const metadata: Metadata = { title: "Donations" };

export default async function DonationsPage(props: PageProps<"/admin/donations">) {
  const sp = await props.searchParams;
  const f = readFilter(sp);
  const created = typeof sp.created === "string" ? sp.created : "";
  const [all, camps, base] = await Promise.all([store.listDonations(), store.listCamps(), siteUrl()]);
  const rows = applyFilter(all, f);
  const totalKg = round2(rows.filter((d) => d.status === "issued").reduce((s, d) => s + d.weightKg, 0));
  const exportQs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const campNames = [...new Set([...camps.map((c) => c.name), ...all.map((d) => d.camp)])];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold text-g">Donations</h1>
          <p className="text-sm text-muted">
            {rows.length} record{rows.length === 1 ? "" : "s"} · {fmtKg(totalKg)} KG
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/admin/export${exportQs ? `?${exportQs}` : ""}`} className="btn-ghost">
            ⬇ Export CSV
          </a>
          <Link href="/admin/donations/new" className="btn">
            + New entry
          </Link>
        </div>
      </div>

      {created && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-mb bg-mint px-4 py-3 text-sm">
          <span>
            ✓ Saved <b className="font-head text-g">{created}</b> — certificate generated.
          </span>
          <Link href={`/certificate/${created}`} target="_blank" className="font-semibold text-g2 underline">
            Open certificate
          </Link>
        </div>
      )}

      <form className="card mb-4 grid gap-2 p-3 sm:grid-cols-[1fr_260px_150px_auto]">
        <input name="q" defaultValue={f.q} placeholder="Search name, ID, mobile, society…" className="input" />
        <select name="camp" defaultValue={f.camp} className="input">
          <option value="">All camps</option>
          {campNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={f.status} className="input">
          <option value="">All status</option>
          <option value="issued">Issued</option>
          <option value="void">Cancelled</option>
        </select>
        <div className="flex gap-2">
          <button className="btn">Filter</button>
          {(f.q || f.camp || f.status) && (
            <Link href="/admin/donations" className="btn-ghost">
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="bg-g text-left text-xs text-white uppercase">
            <tr className="[&_th]:px-3 [&_th]:py-3 [&_th]:font-semibold">
              <th>Donation ID</th>
              <th>Donor</th>
              <th>Mobile</th>
              <th>Textile</th>
              <th className="text-right">KG</th>
              <th className="text-right">Items / Pairs</th>
              <th>Camp</th>
              <th>Date</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr
                key={d.id}
                className={`border-t border-line align-top [&_td]:px-3 [&_td]:py-3 ${d.id === created ? "bg-mint/60" : ""} ${d.status === "void" ? "text-muted" : ""}`}
              >
                <td className="font-head font-semibold whitespace-nowrap text-g">
                  {d.id}
                  <div className="font-sans text-[11px] font-normal text-muted">{fmtDateTime(d.createdAt)}</div>
                </td>
                <td className="min-w-44">
                  <div className="font-semibold">{d.donorName}</div>
                  <div className="text-xs text-muted">{d.organization || d.donorType}</div>
                </td>
                <td className="whitespace-nowrap tabular-nums">{d.mobile}</td>
                <td className="min-w-32 max-w-48 text-xs">{d.textileTypes.join(", ")}</td>
                <td className="text-right font-bold tabular-nums">{fmtKg(d.weightKg)}</td>
                <td className="text-right tabular-nums">
                  {d.items || "—"} / {d.footwearPairs}
                </td>
                <td className="min-w-52 max-w-64 text-xs">{d.camp}</td>
                <td className="whitespace-nowrap">{fmtDate(d.donationDate)}</td>
                <td>
                  {d.status === "issued" ? (
                    <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-g">Issued</span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">Cancelled</span>
                  )}
                  <div className="mt-1 text-[11px] text-muted">{d.source === "admin" ? "Offline entry" : "QR form"}</div>
                </td>
                <td>
                  <div className="flex justify-end gap-1.5 whitespace-nowrap">
                    <Link href={`/certificate/${d.id}`} target="_blank" className="btn-ghost btn-sm">
                      Certificate
                    </Link>
                    <a
                      href={whatsappLink(d, `${base}/certificate/${d.id}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-[#25D366] hover:bg-[#1da851]"
                      title="Send certificate on WhatsApp"
                    >
                      WhatsApp
                    </a>
                    <StatusToggle id={d.id} status={d.status} />
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={10} className="py-10 text-center text-muted">
                  No donations match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
