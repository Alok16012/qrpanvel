import type { Camp, Donation, DonationStatus, NewDonation } from "../types";

/**
 * Storage interface. Demo mode uses a local JSON file; production uses
 * Supabase. Pages and actions only talk to this interface.
 */
export interface Store {
  readonly kind: "demo" | "supabase";
  /** Atomically assigns the next JTRF-YYYY-NNNNN id and saves. */
  createDonation(input: NewDonation, emailStatus: string): Promise<Donation>;
  getDonation(id: string): Promise<Donation | null>;
  listDonations(): Promise<Donation[]>;
  setDonationStatus(id: string, status: DonationStatus): Promise<void>;
  listCamps(): Promise<Camp[]>;
  addCamp(name: string, slug: string): Promise<Camp>;
  setCampActive(slug: string, active: boolean): Promise<void>;
  resetDemo?(): Promise<void>;
}
