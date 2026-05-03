"use client";

import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { buttonVariants } from "@bolao/ui/lib/button-variants";
import { cn } from "@bolao/ui/lib/utils";
import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getCrest } from "@/lib/crest-overrides";
import { translateTeamName } from "@/lib/team-translations";
import { LiveClock } from "./live-clock";

interface HeroMatchProps {
	match: {
		_id: Id<"matches">;
		homeTeam: { name: string; shortName: string; crest: string } | null;
		awayTeam: { name: string; shortName: string; crest: string } | null;
		utcDate: string;
		stage: string;
		group?: string;
		matchday?: number;
		venue?: string;
	};
	hasPrediction?: boolean;
	className?: string;
}

export function HeroMatch({
	match,
	hasPrediction = false,
	className,
}: HeroMatchProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [tilt, setTilt] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const px = (e.clientX - rect.left) / rect.width;
			const py = (e.clientY - rect.top) / rect.height;
			setTilt({ x: (py - 0.5) * 4, y: (px - 0.5) * -4 });
		};
		const onLeave = () => setTilt({ x: 0, y: 0 });
		el.addEventListener("mousemove", onMove);
		el.addEventListener("mouseleave", onLeave);
		return () => {
			el.removeEventListener("mousemove", onMove);
			el.removeEventListener("mouseleave", onLeave);
		};
	}, []);

	const homeName = translateTeamName(match.homeTeam?.shortName ?? "") || "TBD";
	const awayName = translateTeamName(match.awayTeam?.shortName ?? "") || "TBD";
	const groupLetter = match.group?.replace(/^GROUP_/, "") ?? match.group;
	const stageLabel = match.group
		? `GRUPO ${groupLetter}`
		: match.matchday
			? `RODADA ${match.matchday}`
			: match.stage.replace(/_/g, " ");

	return (
		<div
			ref={ref}
			className={cn(
				"group/hero relative isolate overflow-hidden rounded-[32px] text-[var(--b-text)] dark:text-white",
				"[background:linear-gradient(180deg,color-mix(in_oklch,var(--b-brand)_14%,var(--b-card)),var(--b-card))] dark:[background:var(--g-hero-match)]",
				"animate-fade-in shadow-[var(--b-shadow-brand-lg)]",
				className,
			)}
			style={{
				perspective: "1200px",
			}}
		>
			{/* Glow respirando */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-10 hidden animate-glow-breath dark:block"
				style={{
					background:
						"radial-gradient(ellipse 90% 60% at 50% 0%, color-mix(in oklch, var(--b-brand) 40%, transparent) 0%, transparent 70%)",
				}}
			/>

			{/* Top strip */}
			<div className="flex flex-wrap items-center gap-3 border-[var(--b-brand-25)] border-b px-6 py-3 text-[var(--b-text-2)] dark:border-white/10 dark:text-white/90">
				<span className="text-eyebrow">{stageLabel}</span>
				<span className="text-[var(--b-text-4)] text-eyebrow dark:text-white/50">
					·
				</span>
				<span className="text-eyebrow">Próximo jogo</span>
				{match.venue && (
					<span className="ml-auto inline-flex items-center gap-1.5 text-[var(--b-text-3)] text-xs dark:text-white/70">
						<MapPin className="h-3.5 w-3.5" />
						{match.venue}
					</span>
				)}
			</div>

			{/* Body */}
			<div
				className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-8 sm:px-10 sm:py-12"
				style={{
					transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
					transformStyle: "preserve-3d",
					transition: "transform 200ms var(--ease-out-quart)",
				}}
			>
				{/* Home */}
				<div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
					<HeroCrest
						crest={getCrest(
							match.homeTeam?.shortName ?? "",
							match.homeTeam?.crest ?? "",
						)}
						name={homeName}
					/>
					<span className="text-center font-black font-display text-2xl uppercase leading-none tracking-tight sm:text-left sm:text-4xl">
						{homeName}
					</span>
				</div>

				{/* Center: countdown */}
				<div className="flex flex-col items-center gap-3">
					<span className="text-[var(--b-text-3)] text-eyebrow dark:text-white/60">
						Falta
					</span>
					<LiveClock
						target={match.utcDate}
						size="xl"
						className="font-black text-[var(--b-text)] dark:text-white"
					/>
					<span className="font-mono text-[var(--b-text-3)] text-xs dark:text-white/60">
						{new Date(match.utcDate).toLocaleString("pt-BR", {
							day: "2-digit",
							month: "2-digit",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				</div>

				{/* Away */}
				<div className="flex flex-col items-center gap-3 sm:flex-row-reverse sm:gap-5">
					<HeroCrest
						crest={getCrest(
							match.awayTeam?.shortName ?? "",
							match.awayTeam?.crest ?? "",
						)}
						name={awayName}
					/>
					<span className="text-center font-black font-display text-2xl uppercase leading-none tracking-tight sm:text-right sm:text-4xl">
						{awayName}
					</span>
				</div>
			</div>

			{/* CTA */}
			<div className="flex flex-col items-center gap-3 border-[var(--b-brand-25)] border-t px-6 py-4 sm:flex-row sm:justify-between dark:border-white/10">
				<span className="text-[var(--b-text-3)] text-xs uppercase tracking-wider dark:text-white/70">
					{hasPrediction
						? "Você já palpitou — pode editar"
						: "Sem palpite ainda"}
				</span>
				<Link
					href="/predictions"
					className={cn(buttonVariants({ variant: "brand", size: "default" }))}
				>
					{hasPrediction ? "Editar palpite" : "Palpitar agora"}
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}

function HeroCrest({ crest, name }: { crest: string; name: string }) {
	const [errored, setErrored] = useState(false);
	const size = 72;
	if (!errored && crest?.startsWith("http")) {
		return (
			<div
				className="relative flex items-center justify-center rounded-full"
				style={{
					width: size,
					height: size,
					background: "rgba(255,255,255,0.06)",
					backdropFilter: "blur(8px)",
					boxShadow: "0 0 30px rgba(0,0,0,0.3) inset",
				}}
			>
				<Image
					src={crest}
					alt={name}
					width={size - 12}
					height={size - 12}
					unoptimized
					className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
					onError={() => setErrored(true)}
				/>
			</div>
		);
	}
	return (
		<div
			className="flex items-center justify-center rounded-full font-bold text-lg"
			style={{
				width: size,
				height: size,
				background: "rgba(255,255,255,0.1)",
				color: "white",
			}}
		>
			{name.slice(0, 2).toUpperCase()}
		</div>
	);
}
