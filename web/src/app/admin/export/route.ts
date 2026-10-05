import { isAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { applyFilter, readFilter } from "@/lib/filters";
import { todayIST } from "@/lib/format";

const COLS: [string, (d: Awaited<ReturnType<typeof store.listDonations>>[number]) => string | number][] = [
  ["Donation ID", (d) => d.id],
  ["Created At", (d) => d.createdAt],
  ["Donor Name", (d) => d.donorName],
  ["Donor Type", (d) => d.donorType],
  ["Organization", (d) => d.organization],
  ["Mobile", (d) => d.mobile],
  ["Email", (d) => d.email],
  ["Address", (d) => d.address],
  ["Type of Textile", (d) => d.textileTypes.join(", ")],
  ["Quantity (Kg)", (d) => d.weightKg],
  ["Items", (d) => d.items],
  ["Footwear (pairs)", (d) => d.footwearPairs],
  ["Collection Camp", (d) => d.camp],
  ["Date of Donation", (d) => d.donationDate],
  ["Status", (d) => d.status],
  ["Email Status", (d) => d.emailStatus],
  ["Source", (d) => d.source],
];

// Quote every cell; prefix formula-like values so Excel won't execute them.
const cell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = applyFilter(await store.listDonations(), readFilter(sp));
  const csv =
    "﻿" +
    [COLS.map(([h]) => cell(h)).join(","), ...rows.map((d) => COLS.map(([, f]) => cell(f(d))).join(","))].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jtrf-donations-${todayIST()}.csv"`,
    },
  });
}
