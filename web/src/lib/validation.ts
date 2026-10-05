import { DONOR_TYPES } from "./config";
import type { NewDonation } from "./types";

export type FieldErrors = Partial<Record<string, string>>;

export const cleanText = (v: unknown, max = 80) =>
  String(v ?? "")
    .replace(/[\u0000-\u001F{}<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Validates raw form input. Same rules as the original Google Form. */
export function parseDonation(
  fd: FormData,
  source: NewDonation["source"],
): { ok: true; data: NewDonation } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const get = (k: string) => String(fd.get(k) ?? "").trim();

  const donorName = cleanText(get("donorName"));
  if (!donorName) errors.donorName = "Donor name is required";

  const donorType = get("donorType");
  if (!(DONOR_TYPES as readonly string[]).includes(donorType)) errors.donorType = "Select donor type";

  const mobile = get("mobile").replace(/\D/g, "");
  if (!/^[6-9][0-9]{9}$/.test(mobile)) errors.mobile = "Enter a valid 10-digit mobile number";

  const email = get("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";

  const textileTypes = fd
    .getAll("textileTypes")
    .map((v) => cleanText(v, 40))
    .filter(Boolean);
  const otherTextile = cleanText(get("textileOther"), 40);
  if (otherTextile) textileTypes.push(otherTextile);
  if (!textileTypes.length) errors.textileTypes = "Select at least one textile type";

  const weightRaw = get("weightKg");
  const weightKg = num(weightRaw);
  if (!(weightKg > 0)) errors.weightKg = "Enter weight in KG (greater than 0)";
  else if (weightKg > 100000) errors.weightKg = "Weight looks too large";

  const itemsRaw = get("items");
  if (itemsRaw && !/^\d+$/.test(itemsRaw)) errors.items = "Whole number only";
  const pairsRaw = get("footwearPairs");
  if (pairsRaw && !/^\d+$/.test(pairsRaw)) errors.footwearPairs = "Whole number only";

  const camp = cleanText(get("camp") === "__other" ? get("campOther") : get("camp"), 120);
  if (!camp) errors.camp = "Select collection camp / location";

  const donationDate = get("donationDate");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(donationDate) || isNaN(Date.parse(donationDate)))
    errors.donationDate = "Select donation date";

  if (source === "form" && !fd.get("consent")) errors.consent = "Consent is required";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      donorName,
      donorType,
      organization: cleanText(get("organization")),
      mobile,
      email,
      address: cleanText(get("address"), 300),
      textileTypes: [...new Set(textileTypes)],
      weightKg: Math.round(weightKg * 100) / 100,
      items: itemsRaw ? parseInt(itemsRaw, 10) : 0,
      footwearPairs: pairsRaw ? parseInt(pairsRaw, 10) : 0,
      camp,
      donationDate,
      source,
    },
  };
}
