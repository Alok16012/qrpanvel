"use client";

import { useActionState, useState, useTransition } from "react";
import { addCamp, resetDemoData, setCampActive, type FormState } from "@/app/actions";

export function AddCampForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addCamp, {});
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="name" className="input" placeholder="e.g. Kamothe Sector 21 – Ganesh Mandal" required />
        <button className="btn shrink-0" disabled={pending}>
          {pending ? "Adding…" : "Add camp"}
        </button>
      </div>
      {state.errors?.name && <p className="err">{state.errors.name}</p>}
      {state.message && <p className="text-xs font-semibold text-g2">✓ {state.message} — QR is ready below.</p>}
    </form>
  );
}

export function CampActiveToggle({ slug, active }: { slug: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-ghost btn-sm border-line text-muted"
      disabled={pending}
      onClick={() => start(() => setCampActive(slug, !active))}
    >
      {pending ? "…" : active ? "Hide from form" : "Show in form"}
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost btn-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "✓ Copied" : "Copy link"}
    </button>
  );
}

export function ResetDemoButton() {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-ghost btn-sm border-line text-muted"
      disabled={pending}
      onClick={() => {
        if (confirm("Reset all demo data back to the sample donations?")) start(() => resetDemoData());
      }}
    >
      {pending ? "Resetting…" : "Reset demo data"}
    </button>
  );
}
