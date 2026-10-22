import { isAdmin } from "@/lib/auth";
import { sendTodaysBirthdayWishes } from "@/lib/birthdays";

export const dynamic = "force-dynamic";

/**
 * Daily birthday-wish job. Called at 09:00 IST by the Netlify scheduled
 * function (netlify/functions/birthday-wishes.mts) or by any external cron:
 *   GET /api/birthdays   with header  Authorization: Bearer <CRON_SECRET>
 * Logged-in admins may also open it in the browser.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || url.searchParams.get("key") || "";
  const authorised = (secret && given === secret) || (await isAdmin());
  if (!authorised) {
    return Response.json(
      { error: secret ? "Unauthorized" : "Set CRON_SECRET in the environment to enable the birthday job" },
      { status: secret ? 401 : 503 },
    );
  }
  const result = await sendTodaysBirthdayWishes();
  return Response.json(result);
}
