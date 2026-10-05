import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={`grid size-10 place-items-center rounded-xl text-xl ${light ? "bg-white/15 text-white" : "bg-g text-white"}`}
        aria-hidden
      >
        ♻
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
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-head font-semibold text-white">JIJA Textile Recovery Facility – Panvel</span>
        <span>📞 98346 65566 · jijagroup.in · jtrfp@jijagroup.in</span>
      </div>
    </footer>
  );
}
