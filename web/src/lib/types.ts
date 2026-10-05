export type DonationStatus = "issued" | "void";

export interface Donation {
  id: string; // JTRF-2026-00001
  createdAt: string; // ISO timestamp
  donorName: string;
  donorType: string;
  organization: string;
  mobile: string;
  email: string;
  address: string;
  textileTypes: string[];
  weightKg: number;
  items: number;
  footwearPairs: number;
  camp: string;
  donationDate: string; // YYYY-MM-DD
  status: DonationStatus;
  emailStatus: string;
  source: "form" | "admin";
}

export type NewDonation = Omit<Donation, "id" | "createdAt" | "status" | "emailStatus">;

export interface Camp {
  slug: string;
  name: string;
  active: boolean;
  createdAt: string;
}

/** Fields that are safe to show publicly (certificate / verify page). */
export interface PublicDonation {
  id: string;
  donorName: string;
  organization: string;
  donorType: string;
  textileTypes: string[];
  weightKg: number;
  items: number;
  footwearPairs: number;
  camp: string;
  donationDate: string;
  status: DonationStatus;
}

export function toPublic(d: Donation): PublicDonation {
  return {
    id: d.id,
    donorName: d.donorName,
    organization: d.organization,
    donorType: d.donorType,
    textileTypes: d.textileTypes,
    weightKg: d.weightKg,
    items: d.items,
    footwearPairs: d.footwearPairs,
    camp: d.camp,
    donationDate: d.donationDate,
    status: d.status,
  };
}
