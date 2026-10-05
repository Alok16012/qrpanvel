import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/Brand";
import { store } from "@/lib/db";
import { fmtDate, fmtKg } from "@/lib/format";
import { VerifyCard } from "../VerifyCard";

export const metadata: Metadata = { title: "Verify Certificate" };

export default async function VerifyResult(props: PageProps<"/verify/[id]">) {
  const id = decodeURIComponent((await props.params).id).trim().toUpperCase();
  const d = /^[A-Z]+-\d{4}-\d+$/.test(id) ? await store.getDonation(id) : null;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <VerifyCard id={id}>
          {!d ? (
            <>
              <span className="inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-bold text-red-700">
                ✖ No certificate found
              </span>
              <p className="mt-3 text-sm">
                No donation record matches <b>{id}</b>. Please check the ID printed on the certificate.
              </p>
            </>
          ) : (
            <>
              {d.status === "issued" ? (
                <span className="inline-block rounded-full border border-mb bg-mint px-4 py-1.5 text-sm font-bold text-g">
                  ✔ Verified Certificate
                </span>
              ) : (
                <span className="inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-bold text-red-700">
                  ✖ Certificate cancelled
                </span>
              )}
              <div className="mt-4 font-serif text-2xl font-bold text-g">{d.donorName}</div>
              {d.organization && <div className="text-sm text-muted">{d.organization}</div>}
              <table className="mt-4 w-full text-sm">
                <tbody className="[&_td]:border-b [&_td]:border-line [&_td]:py-2.5 [&_td:first-child]:w-[44%] [&_td:first-child]:text-muted [&_td:last-child]:font-bold">
                  <tr><td>Donation ID</td><td>{d.id}</td></tr>
                  <tr><td>Quantity Donated</td><td>{fmtKg(d.weightKg)} KG</td></tr>
                  <tr><td>Textile Type</td><td>{d.textileTypes.join(", ")}</td></tr>
                  <tr><td>Donation Date</td><td>{fmtDate(d.donationDate)}</td></tr>
                  <tr><td>Collection Location</td><td>{d.camp}</td></tr>
                </tbody>
              </table>
              {d.status === "issued" && (
                <Link href={`/certificate/${d.id}`} className="btn-ghost mt-4 w-full">
                  View certificate
                </Link>
              )}
            </>
          )}
        </VerifyCard>
        <p className="mt-4 text-center text-xs text-muted">Mobile number, email and address are never shown publicly.</p>
      </main>
      <PublicFooter />
    </>
  );
}
