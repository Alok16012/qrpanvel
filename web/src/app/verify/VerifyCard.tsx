import { ORG } from "@/lib/config";

export function VerifyCard({ children, id = "" }: { children: React.ReactNode; id?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-[3px] border-g bg-white shadow-[0_4px_18px_rgba(27,94,32,.12)]">
      <div className="bg-g px-5 py-4 text-white">
        <h1 className="font-head text-xl font-bold tracking-wide">♻ JIJA TRF PANVEL</h1>
        <p className="text-sm text-white/85">Textile Donation Certificate Verification</p>
      </div>
      <div className="p-5">
        {children}
        <form action="/verify" className="mt-5 flex gap-2">
          <input
            name="id"
            defaultValue={id}
            placeholder="JTRF-2026-00001"
            className="input uppercase"
            aria-label="Donation ID"
            required
          />
          <button className="btn">Verify</button>
        </form>
      </div>
      <div className="border-t border-line bg-cream px-5 py-3 text-center text-xs text-muted">
        {ORG.name} · 📞 {ORG.phone} · {ORG.website}
      </div>
    </div>
  );
}
