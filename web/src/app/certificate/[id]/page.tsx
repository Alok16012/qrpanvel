import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/Brand";
import { Certificate } from "@/components/Certificate";
import { CertificateActions, ScaledCert } from "@/components/CertificateView";
import { store } from "@/lib/db";
import { fmtKg, whatsappLink } from "@/lib/format";
import { qrSvg, siteUrl } from "@/lib/site";
import { toPublic } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/certificate/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Certificate ${decodeURIComponent(id).toUpperCase()}` };
}

export default async function CertificatePage(props: PageProps<"/certificate/[id]">) {
  const { id } = await props.params;
  const { new: isNew } = await props.searchParams;
  const donation = await store.getDonation(decodeURIComponent(id));
  if (!donation) notFound();

  const d = toPublic(donation);
  const base = await siteUrl();
  const verifyUrl = `${base}/verify/${d.id}`;
  const certUrl = `${base}/certificate/${d.id}`;
  const qr = await qrSvg(verifyUrl);
  // Public page: share link without the donor's number in it.
  const wa = whatsappLink({ ...d, mobile: "" }, certUrl);

  return (
    <>
      <style>{"@media print{@page{size:A4 landscape;margin:0}}"}</style>
      <PublicHeader />
      <main className="print-area mx-auto w-full max-w-6xl px-4 py-8">
        {isNew && (
          <div className="no-print mb-6 flex flex-col gap-3 rounded-2xl border border-mb bg-mint p-5 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-g2 text-2xl text-white">✓</span>
            <div>
              <h1 className="font-head text-xl font-bold text-g">धन्यवाद, {d.donorName}! Donation registered.</h1>
              <p className="text-sm">
                Donation ID <b className="font-head text-g">{d.id}</b> · {fmtKg(d.weightKg)} KG. Download your certificate
                below or share it on WhatsApp.
                {donation.email && " A copy will be emailed once email delivery is switched on."}
              </p>
            </div>
          </div>
        )}

        {d.status === "void" && (
          <div className="no-print mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            This certificate has been cancelled by JIJA TRF and is no longer valid.
          </div>
        )}

        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          {!isNew && <h1 className="font-head text-xl font-bold text-g">Certificate {d.id}</h1>}
          <CertificateActions id={d.id} whatsapp={wa} verifyUrl={verifyUrl} />
        </div>

        <ScaledCert>
          <Certificate d={d} qr={qr} />
        </ScaledCert>

        <p className="no-print mt-6 text-center text-sm text-muted">
          Scan the QR on the certificate or open{" "}
          <Link href={`/verify/${d.id}`} className="font-semibold text-g2 underline">
            the verification page
          </Link>{" "}
          to confirm it is genuine.
        </p>
      </main>
      <PublicFooter />
    </>
  );
}
