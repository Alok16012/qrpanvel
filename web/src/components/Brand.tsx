import Image from "next/image";
import Link from "next/link";
import { ORG } from "@/lib/config";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${light ? "bg-white" : "bg-white ring-1 ring-mb"}`}>
        <Image src={ORG.stamp} alt="" width={40} height={40} priority className="size-10" />
      </span>
      <span className="leading-tight">
        <span className={`block font-head text-lg font-bold ${light ? "text-white" : "text-g"}`}>JIJA TRF</span>
        <span className={`block text-[11px] font-semibold tracking-wide ${light ? "text-white/80" : "text-muted"}`}>
          TEXTILE RECOVERY · PANVEL
        </span>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="no-print border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/verify" className="rounded-lg px-3 py-2 text-muted hover:bg-mint hover:text-g">
            Verify
          </Link>
          <Link href="/donate" className="btn btn-sm">
            Donate
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="no-print mt-auto bg-g text-white/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src={ORG.stamp} alt="" width={48} height={48} className="size-12 rounded-full bg-white p-0.5" />
          <div>
            <div className="font-head font-semibold text-white">{ORG.name}</div>
            <div className="text-xs text-white/70">Recover • Reuse • Recycle • Rebuild</div>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          <li>
            <a href={`tel:+${ORG.phoneIntl}`} className="hover:text-white">
              📞 {ORG.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${ORG.email}`} className="hover:text-white">
              ✉️ {ORG.email}
            </a>
          </li>
          <li>
            <a href={ORG.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              🌐 {ORG.website}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
