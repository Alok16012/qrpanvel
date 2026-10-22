export const ORG = {
  name: "JIJA Textile Recovery Facility – Panvel",
  short: "JIJA TRF Panvel",
  idPrefix: "JTRF",
  idDigits: 5,
  phone: "98346 65566",
  phoneIntl: "919834665566",
  website: "jijagroup.in",
  websiteUrl: "https://jijagroup.in",
  email: "jtrfp@jijagroup.in",
  address: "Panvel, Navi Mumbai, Maharashtra",
  timezone: "Asia/Kolkata",
  signatoryName: "",
  signatoryDesignation: "Authorized Signatory",
  /** Official round stamp – printed on every certificate (public/brand/stamp.png). */
  stamp: "/brand/stamp.png",
  facebookPage: "", // e.g. https://www.facebook.com/jijagroup – shown on the home page when set
};

export const DONOR_TYPES = [
  "Individual",
  "Society",
  "Company / CSR Partner",
  "School / College",
  "NGO / Other",
] as const;

export const TEXTILE_TYPES = [
  "Clothes",
  "Footwear",
  "Bags",
  "Bedsheets / Curtains",
  "Towels / Linen",
] as const;

/** How long the donor commits to donating. "One Time" is the default for walk-in camp donations. */
export const DURATIONS = [
  "One Time",
  "Weekly",
  "Monthly",
  "Quarterly",
  "6 Months",
  "1 Year",
  "2 Years",
  "3 Years",
  "4 Years",
  "5 Years",
  "All Time",
] as const;
export type Duration = (typeof DURATIONS)[number];
export const DEFAULT_DURATION: Duration = "One Time";

export const DEFAULT_CAMPS = [
  "Neelkanth Darshan Society – Opp. Orion Mall, Panvel",
  "JIJA TRF Facility – Panvel",
  "Doorstep Pickup",
];
