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

export function CertificateActions({ id, whatsapp, verifyUrl }: { id: string; whatsapp: string; verifyUrl: string }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

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
      <button className="btn-ghost" onClick={() => window.print()}>
        Print
      </button>
      <button className="btn-ghost" onClick={copyLink}>
        {copied ? "✓ Link copied" : "Copy verify link"}
      </button>
    </div>
  );
}
