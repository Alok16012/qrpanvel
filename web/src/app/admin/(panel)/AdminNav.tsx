"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/donations", label: "Donations", icon: "☰" },
  { href: "/admin/donations/new", label: "New entry", icon: "+" },
  { href: "/admin/camps", label: "Camps & QR", icon: "⌗" },
];

export function AdminNav() {
  const path = usePathname();
  const active = (href: string) => path === href;
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
            active(l.href) ? "bg-white text-g" : "text-white/80 hover:bg-white/10"
          }`}
        >
          <span className="w-4 text-center" aria-hidden>
            {l.icon}
          </span>
          {l.label}
        </Link>
      ))}
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
      >
        <span className="w-4 text-center" aria-hidden>
          ↗
        </span>
        Public site
      </Link>
    </nav>
  );
}
