import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, DM_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

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
	title: "Chuta de Bico — Bolão do Brasileirão",
	description:
		"Faça seus palpites do Brasileirão Série A e dispute com seus amigos.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ConvexAuthNextjsServerProvider>
			<html lang="pt-BR" suppressHydrationWarning>
				<body
					className={`${barlow.variable} ${barlowCondensed.variable} ${dmMono.variable} antialiased`}
				>
					<Providers>{children}</Providers>
				</body>
			</html>
		</ConvexAuthNextjsServerProvider>
	);
}
