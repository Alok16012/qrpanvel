import { Logo } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { logout } from "@/app/actions";
import { AdminNav } from "./AdminNav";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="no-print bg-g text-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0">
        <div className="flex items-center justify-between gap-3 p-4 lg:block lg:p-5">
          <Logo light />
          <form action={logout} className="lg:hidden">
            <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10">Logout</button>
          </form>
        </div>
        <AdminNav />
        <div className="hidden px-5 lg:absolute lg:bottom-5 lg:block lg:w-60">
          {store.kind === "demo" && (
            <p className="mb-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
              Demo mode · data saved locally. Add Supabase keys to go live.
            </p>
          )}
          <form action={logout}>
            <button className="w-full rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
