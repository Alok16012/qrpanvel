import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Brand";
import { DEMO_PASSWORD, isAdmin, usingDemoPassword } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin Login" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid flex-1 place-items-center bg-g px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <Logo />
        <h1 className="mt-6 font-head text-xl font-bold">Admin panel</h1>
        <p className="text-sm text-muted">Donations, certificates, camps & dashboard</p>
        <LoginForm />
        {usingDemoPassword() && (
          <p className="mt-5 rounded-lg bg-mint px-3 py-2 text-xs text-g">
            Demo password: <b className="font-mono">{DEMO_PASSWORD}</b>
          </p>
        )}
      </div>
    </main>
  );
}
