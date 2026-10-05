import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/db";
import { ORG } from "@/lib/config";
import { qrSvg, siteUrl } from "@/lib/site";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "QR Poster" };

export default async function PosterPage(props: PageProps<"/admin/camps/[slug]/poster">) {
  const { slug } = await props.params;
  const base = await siteUrl();
  let campName = "All collection camps";
  let url = `${base}/donate`;
  if (slug !== "general") {
    const camp = (await store.listCamps()).find((c) => c.slug === slug);
    if (!camp) notFound();
    campName = camp.name;
    url = `${base}/donate?camp=${camp.slug}`;
  }
  const qr = await qrSvg(url);

  return (
    <div>
      <style>{"@media print{@page{size:A4 portrait;margin:0} main{padding:0!important} .poster{border-radius:0;height:100vh;max-width:none;aspect-ratio:auto}}"}</style>
      <div className="no-print mb-4 flex items-center gap-3">
        <Link href="/admin/camps" className="text-sm font-semibold text-g2 hover:underline">
          ← Camps
        </Link>
        <PrintButton />
      </div>

      <div className="poster mx-auto flex aspect-[210/297] w-full max-w-[600px] flex-col overflow-hidden rounded-xl border-[10px] border-g bg-cream text-center shadow-xl print:max-w-none print:rounded-none print:shadow-none">
        <div className="bg-g px-6 py-6 text-white">
          <p className="font-deva text-2xl font-bold">वस्त्रदान शिबिर</p>
          <h1 className="font-head text-3xl font-bold tracking-wide">TEXTILE DONATION CAMP</h1>
          <p className="mt-1 text-sm text-white/80">Give Old Clothes a New Life ♻️</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-6">
          <p className="font-head text-xl font-semibold text-g">Scan to register your donation</p>
          <div
            className="w-[62%] rounded-2xl border-4 border-gold bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="rounded-full bg-mint px-4 py-1.5 font-head text-sm font-semibold text-g">📍 {campName}</p>
          <p className="max-w-sm text-sm text-ink">
            Get your <b>Certificate of Textile Donation</b> instantly on your phone — with a unique Donation ID.
          </p>
          <p className="font-deva text-sm text-muted">स्कॅन करा · फॉर्म भरा · प्रमाणपत्र मिळवा</p>
        </div>
        <div className="bg-g px-4 py-3 text-xs text-white/90">
          {ORG.name} · 📞 {ORG.phone} · {ORG.website}
        </div>
      </div>
    </div>
  );
}
