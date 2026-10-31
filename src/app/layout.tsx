import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider, LanguageSwitcher } from "@/i18n/provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TouchCard Business | Votre réseau professionnel",
    template: "%s | TouchCard Business",
  },
  description: "Cartes de visite digitales, NFC, QR code, CRM et fidélisation client réunis dans une seule plateforme.",
  icons: { icon: "/brand/touchcard-mark.svg", shortcut: "/brand/touchcard-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><I18nProvider><div className="fixed right-4 top-4 z-[100]"><LanguageSwitcher /></div>{children}</I18nProvider></body>
    </html>
  );
}
