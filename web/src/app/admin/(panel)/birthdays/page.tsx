import type { Metadata } from "next";
import Link from "next/link";
import { sendBirthdayWishesNow } from "@/app/actions";
import { birthdayList, birthdayWhatsappLink, type BirthdayDonor } from "@/lib/birthdays";
import { store } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { fmtDate, todayIST } from "@/lib/format";

export const metadata: Metadata = { title: "Birthdays" };

export default async function BirthdaysPage(props: PageProps<"/admin/birthdays">) {
  const { msg } = await props.searchParams;
  const all = birthdayList(await store.listDonations());
  const today = all.filter((b) => b.daysUntil === 0);
  const upcoming = all.filter((b) => b.daysUntil > 0 && b.daysUntil <= 30);
  const later = all.length - today.length - upcoming.length;
  const mail = emailConfigured();
  const cron = !!process.env.CRON_SECRET;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold text-g">Donor birthdays 🎂</h1>
          <p className="text-sm text-muted">
            Donors who shared their date of birth get a birthday wish from JIJA TRF — automatically by email every
            morning at 9:00, and with one tap on WhatsApp from here.
          </p>
        </div>
        <form action={sendBirthdayWishesNow}>
          <button className="btn" disabled={!today.length}>
            ✉️ Send today’s email wishes now
          </button>
        </form>
      </div>

      {typeof msg === "string" && msg && (
        <div className="mb-4 rounded-xl border border-mb bg-mint px-4 py-3 text-sm font-semibold text-g">{msg}</div>
      )}

      {(!mail || !cron) && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <b>Automatic wishes are not fully switched on yet.</b>{" "}
          {!mail && (
            <>
              Add <code>RESEND_API_KEY</code> (free at resend.com) so wishes go out by email.{" "}
            </>
          )}
          {!cron && (
            <>
              Add <code>CRON_SECRET</code> so the daily 9:00 AM job can run.{" "}
            </>
          )}
          Until then, use the WhatsApp buttons below — the message is pre-written.
        </div>
      )}

      <Section title={`Today · ${fmtDate(todayIST())}`} empty="No donor has a birthday today.">
        {today.map((b) => (
          <Row key={b.mobile} b={b} today />
        ))}
      </Section>

      <Section title="Next 30 days" empty="No birthdays in the next 30 days.">
        {upcoming.map((b) => (
          <Row key={b.mobile} b={b} />
        ))}
      </Section>

      <p className="mt-4 text-xs text-muted">
        {all.length} donor{all.length === 1 ? "" : "s"} shared a date of birth
        {later > 0 && ` · ${later} more later in the year`}. Dates of birth are private and never shown on certificates
        or the verify page.
      </p>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="card mb-4 p-5">
      <h2 className="mb-3 font-head text-[15px] font-semibold text-g">{title}</h2>
      {children.length ? (
        <ul className="divide-y divide-line">{children}</ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

function Row({ b, today }: { b: BirthdayDonor; today?: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">
          {b.donorName}{" "}
          <span className="text-xs font-normal text-muted">
            turns {b.turning} · {fmtDate(b.next)}
            {!today && ` · in ${b.daysUntil} day${b.daysUntil === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="text-xs text-muted">
          {b.mobile}
          {b.email ? ` · ${b.email}` : " · no email"} ·{" "}
          <Link href={`/certificate/${b.lastDonationId}`} target="_blank" className="text-g2 hover:underline">
            {b.lastDonationId}
          </Link>
        </div>
      </div>
      <a
        href={birthdayWhatsappLink(b)}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-sm bg-[#25D366] hover:bg-[#1da851] ${today ? "" : "opacity-80"}`}
      >
        🎂 Wish on WhatsApp
      </a>
    </li>
  );
}
