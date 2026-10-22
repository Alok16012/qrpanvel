/**
 * Netlify scheduled function – runs every day at 03:30 UTC = 09:00 IST and
 * triggers the app's birthday-wish job. Needs CRON_SECRET in the site's
 * environment variables (same value the Next.js app reads).
 */
const handler = async () => {
  const base = (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.warn("birthday-wishes: URL or CRON_SECRET missing – skipped");
    return;
  }
  const res = await fetch(`${base}/api/birthdays`, { headers: { Authorization: `Bearer ${secret}` } });
  console.log("birthday-wishes:", res.status, await res.text());
};

export default handler;
export const config = { schedule: "30 3 * * *" };
