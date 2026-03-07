import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Buldum - İkinci El İlan",
  description: "İkinci el ilanlarını keşfet, ilan ver, öne çıkar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={outfit.variable}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased font-sans">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-6xl">{children}</main>
      </body>
    </html>
  );
}
