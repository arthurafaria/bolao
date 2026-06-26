"use client";

import { Hourglass, MapPin } from "lucide-react";
import Image from "next/image";
import { getCrest } from "@/lib/crest-overrides";
import type { ResolvedGame, ResolvedSide } from "@/lib/knockout";
import { translateTeamName } from "@/lib/team-translations";

/**
 * Card read-only de um confronto do mata-mata ainda NÃO palpitável (os dois
 * times não estão 100% definidos). Mostra o potencial confronto — lado já
 * resolvido com bandeira, lado em aberto com o rótulo do slot (ex.: “3º A/E/F”).
 * Quando o jogo real nasce, a aba de palpites troca este card pelo Scorecard.
 */
export function KnockoutPreviewCard({ game }: { game: ResolvedGame }) {
	const dateStr = new Date(game.utcDate)
		.toLocaleDateString("pt-BR", {
			weekday: "short",
			day: "2-digit",
			month: "short",
		})
		.replace(/\./g, "")
		.toUpperCase();
	const timeStr = new Date(game.utcDate).toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<article className="relative overflow-hidden rounded-[24px] border border-[var(--b-border-sm)] border-dashed bg-[var(--b-card)] opacity-90 shadow-[var(--b-shadow-card-soft)]">
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-[var(--b-border-sm)] border-b bg-[var(--b-tint)] px-4 py-2">
				<span className="min-w-0 truncate text-[var(--b-text-3)] text-eyebrow">
					Jogo {game.no}
				</span>
				<span className="whitespace-nowrap text-center font-medium font-mono text-[10px] text-[var(--b-text-4)] uppercase tabular-nums tracking-wide sm:text-xs">
					{dateStr}
				</span>
				<div className="flex min-w-0 items-center justify-end gap-2">
					<span className="font-mono font-semibold text-[var(--b-text-3)] text-xs tabular-nums">
						{timeStr}
					</span>
				</div>
			</div>

			<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-5 sm:px-6">
				<SideView side={game.home} align="start" />
				<span className="font-black font-display text-2xl text-[var(--b-border-md)]">
					×
				</span>
				<SideView side={game.away} align="end" />
			</div>

			<div className="flex items-center justify-between gap-3 border-[var(--b-border-sm)] border-t bg-[var(--b-tint)] px-4 py-2.5">
				<div className="flex min-w-0 items-center gap-1.5 text-[var(--b-text-3)] text-xs">
					{game.venue ? (
						<>
							<MapPin className="h-3 w-3 shrink-0" />
							<span className="truncate">{game.venue}</span>
						</>
					) : null}
				</div>
				<span className="flex shrink-0 items-center gap-1.5 font-bold text-[var(--b-text-4)] text-xs uppercase tracking-wider">
					<Hourglass className="h-3.5 w-3.5" />
					Aguardando times
				</span>
			</div>
		</article>
	);
}

function SideView({
	side,
	align,
}: {
	side: ResolvedSide;
	align: "start" | "end";
}) {
	const reverse = align === "end";
	const wrap = reverse
		? "flex min-w-0 flex-row-reverse items-center gap-2 text-right sm:gap-3"
		: "flex min-w-0 items-center gap-2 sm:gap-3";

	if (side.type === "team") {
		const name = translateTeamName(side.team.shortName);
		const crest = getCrest(side.team.shortName, side.team.crest);
		return (
			<div className={wrap}>
				{crest?.startsWith("http") ? (
					<Image
						src={crest}
						alt={name}
						width={40}
						height={40}
						unoptimized
						className="object-contain drop-shadow-md"
						style={{ width: 40, height: 40, borderRadius: 4 }}
						data-crest="true"
					/>
				) : (
					<span
						className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-xs"
						style={{ background: "var(--b-brand-12)", color: "var(--b-brand)" }}
					>
						{name.slice(0, 2).toUpperCase()}
					</span>
				)}
				<span
					className="min-w-0 truncate font-bold font-display text-sm uppercase leading-tight tracking-wide sm:text-base"
					style={{ color: "var(--b-text)" }}
				>
					{name}
				</span>
			</div>
		);
	}

	return (
		<div className={wrap}>
			<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--b-tint-md)] font-bold text-[var(--b-text-4)] text-xs">
				?
			</span>
			<span className="min-w-0 font-medium text-[var(--b-text-3)] text-xs leading-tight">
				{side.label}
			</span>
		</div>
	);
}
