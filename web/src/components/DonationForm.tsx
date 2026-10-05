"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitDonation, type FormState } from "@/app/actions";
import { DONOR_TYPES, ORG, TEXTILE_TYPES } from "@/lib/config";

interface Props {
  camps: string[];
  defaultCamp?: string;
  today: string;
  source: "form" | "admin";
  showDemoFill?: boolean;
}

export function DonationForm({ camps, defaultCamp, today, source, showDemoFill }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitDonation, {});
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.errors ?? {};
  const v = (k: string) => {
    const x = state.values?.[k];
    return Array.isArray(x) ? x[0] ?? "" : x ?? "";
  };
  const textiles = (state.values?.textileTypes as string[] | undefined) ?? [];
  const initialCamp = v("camp") || defaultCamp || "";
  const [camp, setCamp] = useState(initialCamp);

  // After a failed submit, bring the first invalid field into view.
  useEffect(() => {
    if (!state.errors) return;
    formRef.current?.querySelector(".err")?.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  function fillDemo() {
    const f = formRef.current;
    if (!f) return;
    const set = (n: string, val: string) => ((f.elements.namedItem(n) as HTMLInputElement).value = val);
    set("donorName", "Sunita Ramesh Kulkarni");
    set("organization", "Neelkanth Darshan Society");
    set("mobile", "9834665566");
    set("address", "Neelkanth Darshan, Opp. Orion Mall, Panvel");
    set("weightKg", "12.5");
    set("items", "34");
    set("footwearPairs", "4");
    (f.querySelector('[name=donorType][value="Individual"]') as HTMLInputElement).checked = true;
    f.querySelectorAll<HTMLInputElement>("[name=textileTypes]").forEach(
      (c) => (c.checked = c.value === "Clothes" || c.value === "Footwear"),
    );
    const consent = f.querySelector<HTMLInputElement>("[name=consent]");
    if (consent) consent.checked = true;
    setCamp((c) => c || camps[0] || "");
  }

  return (
    <form ref={formRef} action={action} noValidate className="space-y-4">
      <input type="hidden" name="source" value={source} />

      {state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {state.message}
        </div>
      )}
      {Object.keys(e).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          Please fix the highlighted fields.
        </div>
      )}

      <Section title="Donor details">
        <Field label="Donor Name" required hint="दात्याचे नाव — as it should appear on the certificate" error={e.donorName}>
          <input name="donorName" className="input" defaultValue={v("donorName")} autoComplete="name" />
        </Field>

        <Field label="Donor Type" required error={e.donorType}>
          <div className="flex flex-wrap gap-2">
            {DONOR_TYPES.map((t) => (
              <label key={t} className="cursor-pointer">
                <input
                  type="radio"
                  name="donorType"
                  value={t}
                  defaultChecked={v("donorType") ? v("donorType") === t : source === "form" && t === "Individual"}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-muted transition peer-checked:border-g2 peer-checked:bg-mint peer-checked:text-g peer-focus-visible:ring-2 peer-focus-visible:ring-mb">
                  {t}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Organization / Society / School Name" hint="Optional — e.g. Neelkanth Darshan Society">
          <input name="organization" className="input" defaultValue={v("organization")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile Number" required error={e.mobile}>
            <div className="flex">
              <span className="grid place-items-center rounded-l-lg border border-r-0 border-line bg-mint px-3 text-sm font-bold text-g">
                +91
              </span>
              <input
                name="mobile"
                className="input rounded-l-none"
                inputMode="numeric"
                maxLength={10}
                defaultValue={v("mobile")}
                autoComplete="tel-national"
              />
            </div>
          </Field>
          <Field label="Email" hint="Optional — certificate will be emailed" error={e.email}>
            <input name="email" type="email" className="input" defaultValue={v("email")} autoComplete="email" />
          </Field>
        </div>

        <Field label="Address">
          <textarea name="address" rows={2} className="input" defaultValue={v("address")} autoComplete="street-address" />
        </Field>
      </Section>

      <Section title="Donation details">
        <Field label="Type of Textile" required error={e.textileTypes}>
          <div className="flex flex-wrap gap-2">
            {TEXTILE_TYPES.map((t) => (
              <label key={t} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="textileTypes"
                  value={t}
                  defaultChecked={textiles.includes(t)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-muted transition peer-checked:border-g2 peer-checked:bg-mint peer-checked:text-g peer-focus-visible:ring-2 peer-focus-visible:ring-mb">
                  {t}
                </span>
              </label>
            ))}
          </div>
          <input name="textileOther" className="input mt-2" placeholder="Other (optional)" defaultValue={v("textileOther")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quantity (KG)" required hint="Approx. e.g. 5 or 7.5" error={e.weightKg}>
            <input name="weightKg" className="input" inputMode="decimal" defaultValue={v("weightKg")} />
          </Field>
          <Field label="No. of Items" hint="Approx." error={e.items}>
            <input name="items" className="input" inputMode="numeric" defaultValue={v("items")} />
          </Field>
          <Field label="Footwear (pairs)" hint="0 if none" error={e.footwearPairs}>
            <input name="footwearPairs" className="input" inputMode="numeric" defaultValue={v("footwearPairs")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Collection Camp / Location" required error={e.camp}>
            <select name="camp" className="input" value={camp} onChange={(ev) => setCamp(ev.target.value)}>
              <option value="" disabled>
                Select camp…
              </option>
              {camps.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__other">Other…</option>
            </select>
            {camp === "__other" && (
              <input name="campOther" className="input mt-2" placeholder="Enter location" defaultValue={v("campOther")} />
            )}
          </Field>
          <Field label="Date of Donation" required error={e.donationDate}>
            <input
              name="donationDate"
              type="date"
              className="input"
              max={today}
              defaultValue={v("donationDate") || today}
            />
          </Field>
        </div>
      </Section>

      {source === "form" && (
        <div className="card p-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-g2" defaultChecked={!!v("consent")} />
            <span>
              I donate these textiles voluntarily for reuse, upcycling and recycling by {ORG.short}.{" "}
              <span className="text-red-700">*</span>
            </span>
          </label>
          {e.consent && <p className="err">{e.consent}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn px-8 py-3 text-base" disabled={pending}>
          {pending ? "Generating certificate…" : source === "admin" ? "Save & issue certificate" : "Submit & get certificate"}
        </button>
        {showDemoFill && (
          <button type="button" className="btn-ghost" onClick={fillDemo}>
            Fill demo data
          </button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card space-y-4 p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-head text-base font-semibold text-g">{title}</h2>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">
        {label} {required && <span className="text-red-700">*</span>}
      </span>
      {hint && <p className="-mt-1 mb-1.5 text-xs text-muted">{hint}</p>}
      <div className={error ? "[&_.input]:border-red-400" : ""}>{children}</div>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
