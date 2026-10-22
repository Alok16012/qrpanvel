import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ORG } from "@/lib/config";
import { store } from "@/lib/db";
import { fmtDate, fmtKg } from "@/lib/format";

export const alt = "JIJA TRF Panvel – Textile Donation Certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview card for Facebook / WhatsApp shares of a certificate link. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await store.getDonation(decodeURIComponent(id));
  let stamp = "";
  try {
    stamp = `data:image/png;base64,${(await readFile(join(process.cwd(), "public", "brand", "stamp.png"))).toString("base64")}`;
  } catch {
    /* stamp optional */
  }
  const G = "#1B5E20";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FBFAF3",
          border: `18px solid ${G}`,
          padding: "44px 64px",
          fontFamily: "Arial, sans-serif",
          color: "#263238",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: G, lineHeight: 1 }}>JIJA</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: G, letterSpacing: 2 }}>TEXTILE RECOVERY FACILITY – PANVEL</div>
          </div>
          {stamp ? (
            <img src={stamp} alt="" width={150} height={150} />
          ) : (
            <div style={{ fontSize: 28, fontWeight: 700, color: G }}>♻ ZERO TEXTILE WASTE</div>
          )}
        </div>

        {d ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: G,
                color: "#fff",
                fontSize: 26,
                fontWeight: 700,
                padding: "8px 22px",
                borderRadius: 10,
                letterSpacing: 1,
              }}
            >
              TEXTILE DONATION CERTIFICATE
            </div>
            <div style={{ fontSize: 24, color: "#607D8B", marginTop: 26, fontStyle: "italic" }}>Proudly presented to</div>
            <div style={{ fontSize: d.donorName.length > 26 ? 44 : 58, fontWeight: 800, color: G, marginTop: 4 }}>
              {d.donorName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 22 }}>
              <div
                style={{
                  display: "flex",
                  background: "#EEF6EA",
                  border: `3px solid #2E7D32`,
                  borderRadius: 16,
                  padding: "10px 28px",
                  fontSize: 46,
                  fontWeight: 800,
                  color: G,
                }}
              >
                {`${fmtKg(d.weightKg)} KG`}
              </div>
              <div style={{ display: "flex", flexDirection: "column", fontSize: 24 }}>
                <div>{`of textiles donated · ${d.duration}`}</div>
                <div style={{ color: "#607D8B" }}>{`${d.id} · ${fmtDate(d.donationDate)}`}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, alignItems: "center", fontSize: 40, color: G, fontWeight: 700 }}>
            Certificate not found
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#2E7D32", fontWeight: 700 }}>
          <div>“Don’t throw textile waste. Recover it!”</div>
          <div>{`${ORG.phone} · ${ORG.website}`}</div>
        </div>
      </div>
    ),
    size,
  );
}
