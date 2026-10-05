import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/Brand";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto grid max-w-md flex-1 place-items-center px-4 py-20 text-center">
        <div>
          <p className="font-head text-6xl font-bold text-g">404</p>
          <p className="mt-2 text-muted">This page or certificate could not be found.</p>
          <Link href="/" className="btn mt-6">
            Go home
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
