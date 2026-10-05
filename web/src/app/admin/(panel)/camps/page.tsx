import type { Metadata } from "next";
import Link from "next/link";
import { store } from "@/lib/db";
import { fmtKg } from "@/lib/format";
import { qrSvg, siteUrl } from "@/lib/site";
import { computeStats } from "@/lib/stats";
import { AddCampForm, CampActiveToggle, CopyButton, ResetDemoButton } from "./CampControls";

export const metadata: Metadata = { title: "Camps & QR" };

export default async function CampsPage() {
  const [camps, donations, base] = await Promise.all([store.listCamps(), store.listDonations(), siteUrl()]);
  const byCamp = new Map(computeStats(donations).byCamp.map((b) => [b.key, b]));
  const general = `${base}/donate`;
  const cards = await Promise.all(
    camps.map(async (c) => {
      const url = `${base}/donate?camp=${c.slug}`;
      return { ...c, url, qr: await qrSvg(url) };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold text-g">Camps & registration QR codes</h1>
          <p className="text-sm text-muted">
            Each camp has its own QR — donors who scan it get the camp pre-selected. Print the poster and put it at the
            counter.
          </p>
        </div>
        {store.kind === "demo" && <ResetDemoButton />}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="card flex items-center gap-5 p-5">
          <div className="size-28 shrink-0 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: await qrSvg(general) }} />
          <div className="min-w-0">
            <h2 className="font-head font-semibold text-g">General registration (all camps)</h2>
            <p className="truncate text-xs text-muted">{general}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={general} />
              <Link href="/admin/camps/general/poster" className="btn btn-sm">
                Print poster
              </Link>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-head font-semibold text-g">Add a new camp</h2>
          <AddCampForm />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const b = byCamp.get(c.name);
          return (
            <div key={c.slug} className={`card flex flex-col p-5 ${c.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-head font-semibold">{c.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${c.active ? "bg-mint text-g" : "bg-gray-100 text-muted"}`}
                >
                  {c.active ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="my-4 flex items-center gap-4">
                <div className="size-32 shrink-0 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: c.qr }} />
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Collected</dt>
                    <dd className="font-head text-2xl font-bold text-g">{fmtKg(b?.kg ?? 0)} kg</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Donations · Footwear</dt>
                    <dd className="font-semibold">
                      {b?.n ?? 0} · {b?.pairs ?? 0} pairs
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`/admin/camps/${c.slug}/poster`} className="btn btn-sm">
                  Print poster
                </Link>
                <CopyButton text={c.url} />
                <a href={c.url} target="_blank" className="btn-ghost btn-sm">
                  Open form
                </a>
                <CampActiveToggle slug={c.slug} active={c.active} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
