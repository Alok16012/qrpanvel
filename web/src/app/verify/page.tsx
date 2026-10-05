import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/Brand";
import { VerifyCard } from "./VerifyCard";

export const metadata: Metadata = { title: "Verify Certificate" };

export default async function VerifyPage(props: PageProps<"/verify">) {
  const { id } = await props.searchParams;
  const q = String(id ?? "").trim().toUpperCase();
  if (q) redirect(`/verify/${encodeURIComponent(q)}`);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <VerifyCard>
          <p className="text-sm">
            Enter the Donation ID printed on the certificate (e.g. <b>JTRF-2026-00001</b>), or scan the certificate’s QR
            code with your phone camera.
          </p>
        </VerifyCard>
      </main>
      <PublicFooter />
    </>
  );
}
