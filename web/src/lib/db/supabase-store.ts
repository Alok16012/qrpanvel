import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Camp, Donation } from "../types";
import type { Store } from "./types";

// Row shapes in Postgres (snake_case). See supabase/schema.sql.
interface DonationRow {
  id: string;
  created_at: string;
  donor_name: string;
  donor_type: string;
  organization: string;
  mobile: string;
  email: string;
  address: string;
  textile_types: string[];
  weight_kg: number;
  items: number;
  footwear_pairs: number;
  camp: string;
  donation_date: string;
  status: Donation["status"];
  email_status: string;
  source: Donation["source"];
}
interface CampRow {
  slug: string;
  name: string;
  active: boolean;
  created_at: string;
}

const fromRow = (r: DonationRow): Donation => ({
  id: r.id,
  createdAt: r.created_at,
  donorName: r.donor_name,
  donorType: r.donor_type,
  organization: r.organization,
  mobile: r.mobile,
  email: r.email,
  address: r.address,
  textileTypes: r.textile_types,
  weightKg: Number(r.weight_kg),
  items: r.items,
  footwearPairs: r.footwear_pairs,
  camp: r.camp,
  donationDate: r.donation_date,
  status: r.status,
  emailStatus: r.email_status,
  source: r.source,
});
const campFromRow = (r: CampRow): Camp => ({ slug: r.slug, name: r.name, active: r.active, createdAt: r.created_at });

let client: SupabaseClient | null = null;
function db() {
  // Service-role key: server only. RLS stays on with no public policies.
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export const supabaseStore: Store = {
  kind: "supabase",

  async createDonation(input, emailStatus) {
    // create_donation() assigns the ID and inserts in one transaction.
    const row = check(
      await db().rpc("create_donation", {
        p: {
          donor_name: input.donorName,
          donor_type: input.donorType,
          organization: input.organization,
          mobile: input.mobile,
          email: input.email,
          address: input.address,
          textile_types: input.textileTypes,
          weight_kg: input.weightKg,
          items: input.items,
          footwear_pairs: input.footwearPairs,
          camp: input.camp,
          donation_date: input.donationDate,
          email_status: emailStatus,
          source: input.source,
        },
      }),
    ) as DonationRow;
    return fromRow(row);
  },

  async getDonation(id) {
    const row = check(await db().from("donations").select("*").eq("id", id.toUpperCase()).maybeSingle());
    return row ? fromRow(row as DonationRow) : null;
  },

  async listDonations() {
    const rows = check(await db().from("donations").select("*").order("created_at", { ascending: false }));
    return (rows as DonationRow[]).map(fromRow);
  },

  async setDonationStatus(id, status) {
    check(await db().from("donations").update({ status }).eq("id", id));
  },

  async listCamps() {
    const rows = check(await db().from("camps").select("*").order("created_at"));
    return (rows as CampRow[]).map(campFromRow);
  },

  async addCamp(name, slug) {
    const row = check(await db().from("camps").insert({ name, slug }).select().single());
    return campFromRow(row as CampRow);
  },

  async setCampActive(slug, active) {
    check(await db().from("camps").update({ active }).eq("slug", slug));
  },
};
