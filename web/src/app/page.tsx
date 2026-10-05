import Link from "next/link";
import { connection } from "next/server";
import { PublicFooter, PublicHeader } from "@/components/Brand";
import { store } from "@/lib/db";
import { fmtKg } from "@/lib/format";

export default async function Home() {
  await connection();
  const donations = (await store.listDonations()).filter((d) => d.status === "issued");
  const kg = donations.reduce((s, d) => s + d.weightKg, 0);
  const pairs = donations.reduce((s, d) => s + d.footwearPairs, 0);
  const donors = new Set(donations.map((d) => d.mobile)).size;

  return (
    <>
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden bg-g text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-leaf/30 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="font-deva text-lg font-semibold text-mb">वस्त्रदान शिबिर · Textile Donation Drive</p>
              <h1 className="mt-3 font-head text-4xl leading-tight font-bold sm:text-5xl">
                Give old clothes a <span className="text-gold">new life</span>.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/85">
                Donate textiles at any JIJA TRF camp in Panvel, register in 30 seconds, and receive an instant,
                QR-verified Certificate of Donation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/donate" className="btn bg-white px-7 py-3 text-base text-g hover:bg-mint">
                  Register donation →
                </Link>
                <Link href="/verify" className="btn border border-white/40 bg-transparent px-7 py-3 text-base hover:bg-white/10">
                  Verify a certificate
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="KG textiles recovered" value={fmtKg(kg)} big />
              <Stat label="Donations" value={String(donations.length)} />
              <Stat label="Donors" value={String(donors)} />
              <Stat label="Footwear pairs" value={String(pairs)} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-head text-2xl font-bold text-g">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Scan camp QR", "Every camp has its own QR — the camp is pre-selected for you."],
              ["2", "Fill the form", "Name, mobile, textile type and approximate weight."],
              ["3", "Get certificate", "A unique Donation ID (JTRF-2026-xxxxx) and PDF certificate instantly."],
              ["4", "Verify anytime", "Anyone can scan the certificate’s QR to confirm it is genuine."],
            ].map(([n, t, d]) => (
              <div key={n} className="card p-5">
                <span className="grid size-9 place-items-center rounded-full bg-mint font-head font-bold text-g">{n}</span>
                <h3 className="mt-3 font-head font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Reuse", "Wearable clothes go to families in need."],
              ["Upcycle", "Women’s self-help groups turn fabric into bags & mats."],
              ["Recycle", "The rest is recovered as fibre — zero to landfill."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-mb bg-mint p-5">
                <h3 className="font-head font-bold text-g">♻ {t}</h3>
                <p className="mt-1 text-sm">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur ${big ? "col-span-3" : ""}`}>
      <div className={`font-head font-bold tabular-nums ${big ? "text-5xl text-gold" : "text-3xl"}`}>{value}</div>
      <div className="mt-1 text-sm text-white/75">{label}</div>
    </div>
  );
}
