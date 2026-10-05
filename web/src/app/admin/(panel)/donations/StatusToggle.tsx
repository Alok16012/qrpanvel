"use client";

import { useTransition } from "react";
import { setDonationStatus } from "@/app/actions";

export function StatusToggle({ id, status }: { id: string; status: "issued" | "void" }) {
  const [pending, start] = useTransition();
  const cancel = status === "issued";
  return (
    <button
      className={`btn-sm rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        cancel ? "border-red-200 text-red-700 hover:bg-red-50" : "border-line text-g hover:bg-mint"
      }`}
      disabled={pending}
      onClick={() => {
        if (cancel && !confirm(`Cancel certificate ${id}? The verify page will show it as cancelled.`)) return;
        start(() => setDonationStatus(id, cancel ? "void" : "issued"));
      }}
    >
      {pending ? "…" : cancel ? "Cancel" : "Restore"}
    </button>
  );
}
