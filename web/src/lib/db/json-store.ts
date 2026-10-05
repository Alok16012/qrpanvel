import "server-only";
import { promises as fs, constants } from "fs";
import path from "path";
import os from "os";
import { DEFAULT_CAMPS, ORG } from "../config";
import { slugify } from "../format";
import type { Camp, Donation } from "../types";
import type { Store } from "./types";

interface DbFile {
  camps: Camp[];
  donations: Donation[];
  counters: Record<string, number>;
}

const TMP_DB = path.join(os.tmpdir(), "jtrf-demo-db.json");
// Serverless hosts (Vercel, Netlify, …) have a read-only project folder, so
// the demo file goes to /tmp there. Use Supabase for data that must persist.
const serverless = !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
let DB_PATH =
  process.env.DEMO_DB_PATH || (serverless ? TMP_DB : path.join(process.cwd(), "data", "demo-db.json"));

// All reads/writes go through this chain so concurrent submissions can never
// get the same Donation ID (single Node process).
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

let seeding: Promise<DbFile> | null = null;

async function read(): Promise<DbFile> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as DbFile;
  } catch {
    // First run: create the file once, even if many requests arrive together.
    seeding ??= (async () => {
      const seeded = seed();
      await write(seeded);
      return seeded;
    })().finally(() => (seeding = null));
    return seeding;
  }
}

async function write(db: DbFile) {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.access(path.dirname(DB_PATH), constants.W_OK);
  } catch {
    DB_PATH = TMP_DB; // project folder not writable → fall back to /tmp
  }
  const tmp = `${DB_PATH}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_PATH); // atomic swap: readers never see a half-written file
}

function formatId(year: string, n: number) {
  return `${ORG.idPrefix}-${year}-${String(n).padStart(ORG.idDigits, "0")}`;
}

function nextId(db: DbFile, year: string) {
  // Cross-check with existing rows so a reset counter can never duplicate.
  let n = db.counters[year] ?? 0;
  const re = new RegExp(`^${ORG.idPrefix}-(\\d{4})-(\\d+)$`);
  for (const d of db.donations) {
    const m = d.id.match(re);
    if (m && m[1] === year) n = Math.max(n, Number(m[2]));
  }
  db.counters[year] = n + 1;
  return formatId(year, n + 1);
}

export const jsonStore: Store = {
  kind: "demo",

  createDonation(input, emailStatus) {
    return serial(async () => {
      const db = await read();
      const now = new Date();
      const year = new Intl.DateTimeFormat("en-CA", { timeZone: ORG.timezone, year: "numeric" }).format(now);
      const donation: Donation = {
        ...input,
        id: nextId(db, year),
        createdAt: now.toISOString(),
        status: "issued",
        emailStatus,
      };
      db.donations.push(donation);
      await write(db);
      return donation;
    });
  },

  async getDonation(id) {
    const db = await read();
    return db.donations.find((d) => d.id === id.toUpperCase()) ?? null;
  },

  async listDonations() {
    const db = await read();
    return [...db.donations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  setDonationStatus(id, status) {
    return serial(async () => {
      const db = await read();
      const d = db.donations.find((x) => x.id === id);
      if (!d) throw new Error("Donation not found");
      d.status = status;
      await write(db);
    });
  },

  async listCamps() {
    return (await read()).camps;
  },

  addCamp(name, slug) {
    return serial(async () => {
      const db = await read();
      if (db.camps.some((c) => c.slug === slug)) throw new Error("A camp with this name already exists");
      const camp: Camp = { slug, name, active: true, createdAt: new Date().toISOString() };
      db.camps.push(camp);
      await write(db);
      return camp;
    });
  },

  setCampActive(slug, active) {
    return serial(async () => {
      const db = await read();
      const c = db.camps.find((x) => x.slug === slug);
      if (!c) throw new Error("Camp not found");
      c.active = active;
      await write(db);
    });
  },

  resetDemo() {
    return serial(() => write(seed()));
  },
};

// ---------------------------------------------------------------------------
// Demo seed: realistic-looking donations over the last ~5 months.
// ---------------------------------------------------------------------------
function seed(): DbFile {
  const camps: Camp[] = [
    ...DEFAULT_CAMPS,
    "Kalamboli Sector 5 – Community Hall",
    "Kharghar – Little World Mall Camp",
  ].map((name, i) => ({
    slug: slugify(name),
    name,
    active: true,
    createdAt: new Date(Date.UTC(2026, 4, 1 + i)).toISOString(),
  }));

  type S = [string, string, string, string, string[], number, number, number, number];
  const S: S[] = [
    ["Neelkanth Darshan Society", "Society", "Neelkanth Darshan Society", "9822012345", ["Clothes", "Footwear", "Bedsheets / Curtains"], 42, 120, 14, 0],
    ["Priya Deshmukh", "Individual", "", "9876543210", ["Clothes", "Bags"], 6.5, 18, 0, 0],
    ["Rahul Patil", "Individual", "", "9930011122", ["Clothes", "Footwear"], 8, 22, 3, 2],
    ["Orchid Retail CSR Team", "Company / CSR Partner", "Orchid Retail Pvt. Ltd.", "9819098190", ["Clothes", "Bags", "Towels / Linen"], 75.5, 210, 0, 1],
    ["Vidya Mandir School", "School / College", "Vidya Mandir School, Panvel", "9867112233", ["Clothes", "Bags"], 58, 190, 0, 1],
    ["Meena Kulkarni", "Individual", "", "9821456789", ["Clothes", "Bedsheets / Curtains"], 11.5, 26, 0, 0],
    ["Sai Krupa CHS", "Society", "Sai Krupa CHS, Kalamboli", "9833221100", ["Clothes", "Footwear", "Towels / Linen"], 37, 104, 22, 3],
    ["Amit Shinde", "Individual", "", "9769001234", ["Clothes"], 4, 12, 0, 2],
    ["Green Earth Foundation", "NGO / Other", "Green Earth Foundation", "9920334455", ["Clothes", "Footwear", "Bags"], 64, 170, 30, 1],
    ["Kavita Joshi", "Individual", "", "9892345678", ["Clothes", "Footwear"], 9.5, 25, 4, 4],
    ["Harmony Heights", "Society", "Harmony Heights, Kharghar", "9819556677", ["Clothes", "Bedsheets / Curtains"], 49, 132, 0, 4],
    ["Suresh Mhatre", "Individual", "", "9004567890", ["Clothes", "Towels / Linen"], 7, 20, 0, 0],
    ["Sunshine English School", "School / College", "Sunshine English School, New Panvel", "9822778899", ["Clothes", "Bags", "Footwear"], 81, 240, 41, 1],
    ["Anjali Pawar", "Individual", "", "9773456123", ["Clothes"], 5.5, 15, 0, 0],
    ["Shanti Niketan CHS", "Society", "Shanti Niketan CHS", "9867009988", ["Clothes", "Footwear"], 28, 80, 16, 0],
    ["Vikram Gaikwad", "Individual", "", "9930887766", ["Clothes", "Bags"], 12, 30, 0, 2],
    ["Navi Textiles CSR Volunteers", "Company / CSR Partner", "Navi Textiles Pvt. Ltd.", "9820123987", ["Clothes", "Towels / Linen", "Bedsheets / Curtains"], 96, 260, 0, 1],
    ["Pooja Naik", "Individual", "", "9757123456", ["Clothes", "Footwear"], 6, 17, 2, 3],
    ["Sunrise Residency", "Society", "Sunrise Residency, Kalamboli", "9819332211", ["Clothes"], 33, 95, 0, 3],
    ["Nitin Bhoir", "Individual", "", "9869456321", ["Clothes", "Footwear", "Bags"], 10, 28, 5, 4],
    ["Swati Kadam", "Individual", "", "9821987654", ["Bedsheets / Curtains", "Towels / Linen"], 8.5, 14, 0, 0],
    ["Panvel Youth Volunteers", "NGO / Other", "Panvel Youth Volunteers Group", "9822456123", ["Clothes", "Footwear"], 52, 150, 24, 1],
  ];

  // Spread across May–Oct 2026, oldest first so IDs increase with time.
  const start = Date.UTC(2026, 4, 12);
  const end = Date.UTC(2026, 9, 3);
  const donations: Donation[] = S.map((s, i) => {
    const t = start + ((end - start) * i) / (S.length - 1) + (i % 3) * 3600_000 * 5;
    const date = new Date(t);
    return {
      id: formatId("2026", i + 1),
      createdAt: date.toISOString(),
      donorName: s[0],
      donorType: s[1],
      organization: s[2],
      mobile: s[3],
      email: i % 3 === 0 ? `${slugify(s[0]).split("-")[0]}@example.com` : "",
      address: "Panvel, Navi Mumbai",
      textileTypes: s[4],
      weightKg: s[5],
      items: s[6],
      footwearPairs: s[7],
      camp: camps[s[8]].name,
      donationDate: date.toISOString().slice(0, 10),
      status: "issued" as const,
      emailStatus: i % 3 === 0 ? "Demo – not sent" : "No email",
      source: (i % 4 === 0 ? "admin" : "form") as Donation["source"],
    };
  });
  return { camps, donations, counters: { "2026": donations.length } };
}
