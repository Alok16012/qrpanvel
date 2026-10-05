import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/Brand";
import { DonationForm } from "@/components/DonationForm";
import { store } from "@/lib/db";
import { ORG } from "@/lib/config";
import { todayIST } from "@/lib/format";

export const metadata: Metadata = { title: "Register Donation" };

export default async function DonatePage(props: PageProps<"/donate">) {
  const { camp: campSlug } = await props.searchParams;
  const camps = (await store.listCamps()).filter((c) => c.active);
  const preselected = camps.find((c) => c.slug === campSlug);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="card mb-4 overflow-hidden">
          <div className="h-2 bg-g" />
          <div className="p-6">
            <p className="font-deva font-semibold text-navy">वस्त्रदान शिबिर</p>
            <h1 className="font-head text-2xl font-bold text-g">Textile Donation Registration</h1>
            <p className="mt-1 text-sm text-muted">
              {ORG.name} · Give Old Clothes a New Life ♻️ — your certificate is generated instantly after you submit.
            </p>
            {preselected && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-sm font-semibold text-g">
                📍 {preselected.name}
              </p>
            )}
          </div>
        </div>
        <DonationForm
          camps={camps.map((c) => c.name)}
          defaultCamp={preselected?.name}
          today={todayIST()}
          source="form"
          showDemoFill={store.kind === "demo"}
        />
      </main>
      <PublicFooter />
    </>
  );
}
