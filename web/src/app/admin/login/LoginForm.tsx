"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="mt-5 space-y-3">
      <label className="label" htmlFor="password">
        Password
      </label>
      <input id="password" name="password" type="password" className="input" autoFocus required />
      {state.message && <p className="err">{state.message}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
