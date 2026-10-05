import type { Metadata } from "next";
import { DonationForm } from "@/components/DonationForm";
import { store } from "@/lib/db";
import { todayIST } from "@/lib/format";

export const metadata: Metadata = { title: "New entry" };

export default async function NewDonationPage() {
  const camps = (await store.listCamps()).filter((c) => c.active);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-head text-2xl font-bold text-g">New donation entry</h1>
      <p className="mb-5 text-sm text-muted">
        For donations written in the offline register at a camp. A Donation ID and certificate are issued immediately.
      </p>
      <DonationForm camps={camps.map((c) => c.name)} today={todayIST()} source="admin" showDemoFill={store.kind === "demo"} />
    </div>
  );
}
