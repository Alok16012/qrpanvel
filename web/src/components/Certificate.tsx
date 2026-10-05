import { ORG } from "@/lib/config";
import { fmtDate, fmtKg } from "@/lib/format";
import type { PublicDonation } from "@/lib/types";

const G = "#1B5E20";
const G2 = "#2E7D32";

type BoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  cls?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};
const Box = ({ x, y, w, h, cls = "", style, children }: BoxProps) => (
  <div className={`a ${cls}`} style={{ left: x, top: y, width: w, height: h, ...style }}>
    {children}
  </div>
);

const head: React.CSSProperties = { fontFamily: "var(--font-poppins)", fontWeight: 700 };
const serif: React.CSSProperties = { fontFamily: "var(--font-playfair)", fontWeight: 700 };

/**
 * A4-landscape certificate (842×595). Same layout as the Google Slides
 * template from the Apps Script version, so both look identical.
 */
export function Certificate({ d, qr }: { d: PublicDonation; qr: string }) {
  const len = d.donorName.length;
  const nameSize = len <= 22 ? 30 : len <= 32 ? 24 : len <= 45 ? 19 : 15;
  const org = d.organization || (d.donorType && d.donorType !== "Individual" ? d.donorType : "");
  const isVoid = d.status === "void";

  return (
    <div className="cert" id="certificate">
      <Box x={8} y={8} w={826} h={579} style={{ border: `7px solid ${G}` }} />
      <Box x={20} y={20} w={802} h={555} style={{ border: "1.5px solid #C9A227" }} />

      {/* Brand */}
      <Box x={36} y={30} w={190} h={44} cls="l" style={{ ...head, fontSize: 36, color: G }}>
        JIJA
      </Box>
      <Box x={36} y={74} w={230} h={16} cls="l" style={{ ...head, fontSize: 9, color: G }}>
        TEXTILE RECOVERY FACILITY – PANVEL
      </Box>
      <Box x={36} y={90} w={220} h={14} cls="l" style={{ fontSize: 8.5, fontStyle: "italic", color: "#43A047" }}>
        Recover • Reuse • Recycle • Rebuild
      </Box>
      <Box x={600} y={32} w={206} h={38} cls="r" style={{ ...head, fontWeight: 600, fontStyle: "italic", fontSize: 11, color: G2 }}>
        Waste to Value.
        <br />
        Women to Opportunity.
      </Box>
      <Box x={600} y={74} w={206} h={18} cls="r" style={{ ...head, fontSize: 10, color: G }}>
        ♻ ZERO TEXTILE WASTE
      </Box>

      {/* Title */}
      <Box
        x={256}
        y={32}
        w={330}
        h={38}
        style={{ ...head, fontSize: 20, background: G, border: "2px solid #C9A227", color: "#fff", letterSpacing: 0.5 }}
      >
        TEXTILE DONATION
      </Box>
      <Box x={256} y={72} w={330} h={34} style={{ ...serif, fontSize: 28, color: G, letterSpacing: 1 }}>
        CERTIFICATE
      </Box>
      <Box x={256} y={106} w={330} h={22} style={{ fontFamily: "var(--font-mukta)", fontWeight: 700, fontSize: 14, color: "#1A237E" }}>
        वस्त्र दान प्रमाणपत्र
      </Box>

      <Box x={40} y={134} w={300} h={18} cls="l" style={{ fontSize: 10, fontWeight: 700 }}>
        Certificate No.:&nbsp; {d.id}
      </Box>
      <Box x={542} y={134} w={260} h={18} cls="r" style={{ fontSize: 10, fontWeight: 700 }}>
        Date:&nbsp; {fmtDate(d.donationDate)}
      </Box>

      {/* Presented to */}
      <Box x={121} y={158} w={600} h={18} style={{ fontSize: 12, fontStyle: "italic", color: "#607D8B" }}>
        This certificate is proudly presented to
      </Box>
      <Box x={81} y={176} w={680} h={40} style={{ ...serif, fontSize: nameSize, color: G }}>
        {d.donorName}
      </Box>
      <Box x={231} y={217} w={380} h={1.5} style={{ background: "#C9A227" }} />
      <Box x={121} y={220} w={600} h={16} style={{ fontSize: 10.5, fontWeight: 700, color: "#1A237E" }}>
        {org}
      </Box>

      {/* Weight */}
      <Box x={121} y={240} w={600} h={16} style={{ fontSize: 11 }}>
        in recognition of the valuable contribution of
      </Box>
      <Box
        x={331}
        y={258}
        w={180}
        h={36}
        style={{ ...head, fontSize: 22, color: G, background: "#EEF6EA", border: `1.5px solid ${G2}`, borderRadius: 10 }}
      >
        {fmtKg(d.weightKg)} KG
      </Box>
      <Box x={81} y={298} w={680} h={16} style={{ fontSize: 11 }}>
        of textile materials to {ORG.name} for responsible
      </Box>
      <Box x={81} y={316} w={680} h={18} style={{ ...head, fontSize: 12, color: G2, wordSpacing: 2 }}>
        REUSE &nbsp;•&nbsp; REPAIR &nbsp;•&nbsp; UPCYCLE &nbsp;•&nbsp; RECYCLE &nbsp;•&nbsp; RECOVER
      </Box>

      {/* Details */}
      <Box x={48} y={346} w={470} h={128} style={{ background: "#EEF6EA", border: "1px solid #A5D6A7", borderRadius: 10 }} />
      <Box
        x={48}
        y={346}
        w={470}
        h={22}
        cls="l"
        style={{ ...head, fontSize: 10.5, background: G, color: "#fff", borderRadius: "10px 10px 0 0", paddingLeft: 12 }}
      >
        Donation Details
      </Box>
      <Box x={58} y={376} w={130} h={94} cls="l tp" style={{ fontSize: 9.5, fontWeight: 700, lineHeight: 1.75 }}>
        <div>
          Donation ID
          <br />
          Type of Textile
          <br />
          Items / Footwear
          <br />
          Collection Location
        </div>
      </Box>
      <Box x={186} y={376} w={326} h={94} cls="l tp" style={{ fontSize: 9.5, lineHeight: 1.75 }}>
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
          :&nbsp; {d.id}
          <br />
          :&nbsp; {d.textileTypes.join(", ")}
          <br />
          :&nbsp; {d.items || "—"} items &nbsp;|&nbsp; {d.footwearPairs || 0} pairs footwear
          <br />
          :&nbsp; {d.camp}
        </div>
      </Box>

      {/* QR */}
      <Box x={548} y={350} w={92} h={92} style={{ background: "#fff", border: "1px solid #A5D6A7", padding: 3 }}>
        <div style={{ width: 84, height: 84 }} dangerouslySetInnerHTML={{ __html: qr }} />
      </Box>
      <Box x={528} y={442} w={132} h={14} style={{ fontSize: 8, fontStyle: "italic", color: "#607D8B" }}>
        Scan to verify
      </Box>
      <Box x={520} y={456} w={148} h={18} style={{ ...head, fontSize: 11, color: G }}>
        {d.id}
      </Box>

      {/* Signatory */}
      <Box x={668} y={392} w={150} h={36} style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 18, color: "#1A237E" }}>
        {ORG.signatoryName}
      </Box>
      <Box x={680} y={432} w={126} h={0.8} style={{ background: "#263238" }} />
      <Box x={668} y={434} w={150} h={14} style={{ fontSize: 9, fontWeight: 700 }}>
        {ORG.signatoryDesignation}
      </Box>
      <Box x={662} y={448} w={162} h={26} style={{ fontSize: 7.5, color: "#607D8B" }}>
        For {ORG.name}
      </Box>

      <Box x={48} y={482} w={746} h={20} style={{ fontSize: 11, fontStyle: "italic", fontWeight: 700, color: G2 }}>
        “Don’t throw textile waste. Recover it!” &nbsp;—&nbsp; Together for a Cleaner &amp; Greener Panvel
      </Box>
      <Box
        x={20}
        y={510}
        w={802}
        h={65}
        style={{ ...head, fontWeight: 600, fontSize: 9, background: G, color: "#fff", lineHeight: 1.6 }}
      >
        <div>
          Environmental Protection &nbsp;•&nbsp; Textile Recovery &nbsp;•&nbsp; Resource Conservation &nbsp;•&nbsp;
          Community Development
          <br />
          Tel: {ORG.phone} &nbsp;|&nbsp; {ORG.website} &nbsp;|&nbsp; {ORG.email} &nbsp;|&nbsp; {ORG.address}
        </div>
      </Box>

      {isVoid && (
        <Box
          x={0}
          y={0}
          w={842}
          h={595}
          style={{ background: "rgba(255,255,255,.55)", color: "rgba(198,40,40,.75)", ...head, fontSize: 90, transform: "rotate(-18deg)" }}
        >
          CANCELLED
        </Box>
      )}
    </div>
  );
}
