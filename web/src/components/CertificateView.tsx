"use client";

import { useEffect, useRef, useState } from "react";

/** Scales the fixed 842×595 certificate to fit the available width. */
export function ScaledCert({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1.25, e.contentRect.width / 842)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="w-full">
      <div className="print-cert-scale mx-auto" style={{ width: 842 * scale, height: 595 * scale }}>
        <div
          className="print-cert origin-top-left shadow-[0_8px_40px_rgba(27,94,32,.18)]"
          style={{ transform: `scale(${scale})`, width: 842, height: 595 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function CertificateActions({
  id,
  whatsapp,
  verifyUrl,
  certUrl,
  shareText,
}: {
  id: string;
  whatsapp: string;
  verifyUrl: string;
  certUrl: string;
  shareText: string;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(certUrl)}&quote=${encodeURIComponent(shareText)}`;

  function shareFacebook(ev: React.MouseEvent<HTMLAnchorElement>) {
    // Open the Facebook share dialog as a popup; falls back to a normal link.
    const w = window.open(facebook, "fb-share", "width=640,height=560,menubar=no,toolbar=no,status=no");
    if (w) ev.preventDefault();
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: `Textile Donation Certificate ${id}`, text: shareText, url: certUrl });
    } catch {
      /* user cancelled */
    }
  }

  async function downloadPdf() {
    const node = document.getElementById("certificate");
    if (!node) return;
    setBusy(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      await document.fonts.ready;
      const png = await toPng(node, { pixelRatio: 3, width: 842, height: 595, cacheBust: true });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(png, "PNG", 0, 0, 297, 210);
      pdf.save(`${id} - Donation Certificate.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF download failed — use Print → Save as PDF instead.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button className="btn" onClick={downloadPdf} disabled={busy}>
        {busy ? "Preparing PDF…" : "⬇ Download PDF"}
      </button>
      <a className="btn bg-[#25D366] hover:bg-[#1da851]" href={whatsapp} target="_blank" rel="noopener noreferrer">
        Share on WhatsApp
      </a>
      <a
        className="btn bg-[#1877F2] hover:bg-[#145dbf]"
        href={facebook}
        onClick={shareFacebook}
        target="_blank"
        rel="noopener noreferrer"
        title="Share this certificate on Facebook"
      >
        <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.69 4.54-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
        Share on Facebook
      </a>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button className="btn-ghost" onClick={nativeShare}>
          Share…
        </button>
      )}
      <button className="btn-ghost" onClick={() => window.print()}>
        Print
      </button>
      <button className="btn-ghost" onClick={copyLink}>
        {copied ? "✓ Link copied" : "Copy verify link"}
      </button>
    </div>
  );
}
