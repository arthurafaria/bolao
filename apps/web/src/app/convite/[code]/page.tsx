import { api } from "@bolao/backend/convex/_generated/api";
import { env } from "@bolao/env/web";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";

import { InviteClient } from "./invite-client";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ code: string }>;
}): Promise<Metadata> {
	const { code } = await params;
	const preview = await fetchQuery(
		api.leagues.getInvitePreview,
		{ inviteCode: code.toUpperCase() },
		{ url: env.NEXT_PUBLIC_CONVEX_URL },
	).catch(() => null);

	if (!preview) {
		return {
			title: "Convite — Bolão da Copa 2026",
			robots: { index: false },
		};
	}

	const title = `Você foi convidado para a liga ${preview.name} — Bolão da Copa 2026`;
	const description = `${preview.ownerName ?? "Um amigo"} te convidou para palpitar na liga "${preview.name}" (${preview.memberCount} participante${preview.memberCount === 1 ? "" : "s"}). Toque para entrar!`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			siteName: "Bolão da Copa 2026",
		},
		robots: { index: false },
	};
}

export default async function InvitePage({
	params,
}: {
	params: Promise<{ code: string }>;
}) {
	const { code } = await params;
	return <InviteClient code={code.toUpperCase()} />;
}
