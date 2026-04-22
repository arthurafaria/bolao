import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, DM_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";
import { getToken } from "@/lib/auth-server";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolão da Copa 2026",
  description: "Faça seus palpites para a Copa do Mundo 2026",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken().catch(() => null);
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${barlow.variable} ${barlowCondensed.variable} ${dmMono.variable} antialiased`}>
        <Providers initialToken={token}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
