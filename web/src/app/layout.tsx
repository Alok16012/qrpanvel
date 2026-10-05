import type { Metadata } from "next";
import { Mukta, Open_Sans, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"], style: ["normal", "italic"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["700"] });
const mukta = Mukta({ variable: "--font-mukta", subsets: ["devanagari", "latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "JIJA TRF Panvel – Textile Donation", template: "%s · JIJA TRF Panvel" },
  description: "Register your textile donation and get an instant, verifiable donation certificate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${poppins.variable} ${playfair.variable} ${mukta.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
