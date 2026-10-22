"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/db";
import { checkPassword, endSession, isAdmin, requireAdmin, startSession } from "@/lib/auth";
import { parseDonation, cleanText, type FieldErrors } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { certificateEmail, emailConfigured, sendEmail } from "@/lib/email";
import { sendTodaysBirthdayWishes } from "@/lib/birthdays";
import { siteUrl } from "@/lib/site";

export type FormState = { errors?: FieldErrors; message?: string; values?: Record<string, string | string[]> };

function snapshot(fd: FormData) {
  const v: Record<string, string | string[]> = {};
  for (const k of new Set(fd.keys())) {
    if (k.startsWith("$")) continue;
    const all = fd.getAll(k).map(String);
    v[k] = k === "textileTypes" ? all : all[0];
  }
  return v;
}

const emailStatusFor = (email: string) =>
  !email ? "No email" : emailConfigured() ? "Sending…" : "Not sent – email not configured";

/** Emails the certificate link (Resend). Never throws – the status is stored on the row. */
async function emailCertificate(d: { id: string; donorName: string; weightKg: number; donationDate: string; email: string }) {
  if (!d.email || !emailConfigured()) return;
  const base = await siteUrl();
  const r = await sendEmail({
    to: d.email,
    ...certificateEmail(d, `${base}/certificate/${d.id}`, `${base}/verify/${d.id}`),
  });
  await store.setEmailStatus(d.id, r.ok ? "Sent" : `Failed: ${r.error}`.slice(0, 120)).catch(console.error);
}

export async function submitDonation(_: FormState, fd: FormData): Promise<FormState> {
  const fromAdmin = fd.get("source") === "admin";
  if (fromAdmin && !(await isAdmin())) return { message: "Session expired. Please log in again." };

  const parsed = parseDonation(fd, fromAdmin ? "admin" : "form");
  if (!parsed.ok) return { errors: parsed.errors, values: snapshot(fd) };

  let id: string;
  try {
    const d = await store.createDonation(parsed.data, emailStatusFor(parsed.data.email));
    id = d.id;
    await emailCertificate(d);
  } catch (e) {
    console.error(e);
    return { message: "Could not save the donation. Please try again.", values: snapshot(fd) };
  }
  revalidatePath("/", "layout");
  redirect(fromAdmin ? `/admin/donations?created=${id}` : `/certificate/${id}?new=1`);
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkPassword(String(fd.get("password") ?? ""))) return { message: "Wrong password" };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function setDonationStatus(id: string, status: "issued" | "void") {
  await requireAdmin();
  await store.setDonationStatus(id, status);
  revalidatePath("/", "layout");
}

export async function addCamp(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = cleanText(fd.get("name"), 120);
  if (name.length < 3) return { errors: { name: "Enter camp name" } };
  try {
    await store.addCamp(name, slugify(name) || `camp-${Date.now()}`);
  } catch (e) {
    return { errors: { name: (e as Error).message } };
  }
  revalidatePath("/", "layout");
  return { message: `Camp “${name}” added` };
}

export async function setCampActive(slug: string, active: boolean) {
  await requireAdmin();
  await store.setCampActive(slug, active);
  revalidatePath("/", "layout");
}

export async function resetDemoData() {
  await requireAdmin();
  if (!store.resetDemo) throw new Error("Reset is only available in demo mode");
  await store.resetDemo();
  revalidatePath("/", "layout");
}

/** Admin "Send now" button on /admin/birthdays. */
export async function sendBirthdayWishesNow() {
  await requireAdmin();
  const r = await sendTodaysBirthdayWishes();
  const sent = r.donors.filter((d) => d.emailStatus === "Sent").length;
  const msg = !r.donors.length
    ? "No donor has a birthday today."
    : `${r.donors.length} birthday${r.donors.length === 1 ? "" : "s"} today · ${sent} email${sent === 1 ? "" : "s"} sent` +
      (r.emailConfigured ? "" : " (email not configured – use the WhatsApp buttons)");
  redirect(`/admin/birthdays?msg=${encodeURIComponent(msg)}`);
}
