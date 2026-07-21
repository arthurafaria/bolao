"use client";

import { Crown, Medal, Star, Trophy } from "lucide-react";
import { forwardRef } from "react";

export type ShareFormat = "story" | "feed";

export interface ShareEntry {
	position: number;
	name: string;
	points: number;
	exacts: number;
}

interface ShareRankingCardProps {
	format: ShareFormat;
	leagueName: string;
	phaseLabel: string;
	accent: string;
	entries: ShareEntry[];
}

const DIMENSIONS: Record<ShareFormat, { w: number; h: number }> = {
	story: { w: 360, h: 640 },
	feed: { w: 360, h: 360 },
};

const DISPLAY = "var(--font-barlow-condensed), system-ui, sans-serif";
const BODY = "var(--font-barlow), system-ui, sans-serif";
const MONO = "var(--font-dm-mono), ui-monospace, monospace";

const PODIUM_COLOR = {
	1: "var(--b-gold)",
	2: "var(--b-silver)",
	3: "var(--b-bronze)",
} as const;

function avatarColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return `oklch(0.62 0.16 ${Math.abs(hash) % 360})`;
}

function initials(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

/**
 * Card compartilhável (story/feed) do ranking de uma liga numa fase.
 * Desenhado em px absolutos no nosso design para capturar via html-to-image
 * com `pixelRatio: 3` (story 1080×1920, feed 1080×1080).
 */
export const ShareRankingCard = forwardRef<
	HTMLDivElement,
	ShareRankingCardProps
>(function ShareRankingCard(
	{ format, leagueName, phaseLabel, accent, entries },
	ref,
) {
	const { w, h } = DIMENSIONS[format];
	const isStory = format === "story";
	const top3 = entries.slice(0, 3);
	const rest = entries.slice(3, isStory ? 8 : 5);

	// Ordem visual do pódio: 2º, 1º, 3º
	const podiumOrder = [
		top3.find((e) => e.position === 2),
		top3.find((e) => e.position === 1),
		top3.find((e) => e.position === 3),
	];

	return (
		<div
			ref={ref}
			style={{
				width: w,
				height: h,
				position: "relative",
				overflow: "hidden",
				fontFamily: BODY,
				color: "var(--b-text)",
				background: "var(--b-bg)",
				display: "flex",
				flexDirection: "column",
				padding: isStory ? 28 : 22,
				boxSizing: "border-box",
			}}
		>
			{/* Glows de fundo */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(120% 70% at 50% -10%, color-mix(in oklch, ${accent} 34%, transparent) 0%, transparent 60%), radial-gradient(90% 60% at 100% 110%, color-mix(in oklch, var(--b-brand) 16%, transparent) 0%, transparent 55%)`,
					pointerEvents: "none",
				}}
			/>

			{/* Conteúdo */}
			<div
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					flex: 1,
					minHeight: 0,
				}}
			>
				{/* Header */}
				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<span
						style={{
							fontFamily: MONO,
							fontSize: 10,
							letterSpacing: "0.22em",
							textTransform: "uppercase",
							color: "var(--b-brand)",
							fontWeight: 600,
						}}
					>
						Chuta de Bico
					</span>
					<div
						style={{
							display: "flex",
							alignItems: "flex-end",
							justifyContent: "space-between",
							gap: 10,
						}}
					>
						<h2
							style={{
								fontFamily: DISPLAY,
								fontWeight: 900,
								fontSize: isStory ? 34 : 28,
								lineHeight: 0.92,
								textTransform: "uppercase",
								letterSpacing: "-0.01em",
								margin: 0,
								maxWidth: "72%",
							}}
						>
							{leagueName}
						</h2>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 5,
								padding: "5px 10px",
								borderRadius: 999,
								fontFamily: DISPLAY,
								fontWeight: 800,
								fontSize: 11,
								textTransform: "uppercase",
								letterSpacing: "0.06em",
								color: accent,
								background: `color-mix(in oklch, ${accent} 16%, transparent)`,
								border: `1px solid color-mix(in oklch, ${accent} 40%, transparent)`,
								whiteSpace: "nowrap",
							}}
						>
							<Trophy size={12} />
							{phaseLabel}
						</span>
					</div>
				</div>

				{/* Bloco central (pódio + lista) — centralizado no espaço livre */}
				<div
					style={{
						flex: 1,
						minHeight: 0,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: isStory ? 16 : 12,
						paddingTop: isStory ? 14 : 12,
					}}
				>
					{/* Pódio */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr 1fr",
							alignItems: "end",
							gap: 8,
						}}
					>
						{podiumOrder.map((entry, i) => {
							if (!entry) return <div key={`empty-${i}`} />;
							const pos = entry.position as 1 | 2 | 3;
							const color = PODIUM_COLOR[pos];
							const isFirst = pos === 1;
							const avatarSize = isFirst ? 58 : 48;
							const blockH = isFirst ? (isStory ? 50 : 44) : isStory ? 34 : 30;
							return (
								<div
									key={entry.position}
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: 5,
									}}
								>
									<div style={{ position: "relative" }}>
										{isFirst && (
											<Crown
												size={20}
												style={{
													position: "absolute",
													top: -16,
													left: "50%",
													transform: "translateX(-50%)",
													color: "var(--b-gold)",
												}}
											/>
										)}
										<div
											style={{
												width: avatarSize,
												height: avatarSize,
												borderRadius: 999,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontFamily: DISPLAY,
												fontWeight: 900,
												fontSize: isFirst ? 19 : 16,
												color: "#fff",
												background: avatarColor(entry.name),
												border: `3px solid ${color}`,
												boxSizing: "border-box",
											}}
										>
											{initials(entry.name)}
										</div>
									</div>
									<span
										style={{
											fontFamily: DISPLAY,
											fontWeight: 800,
											fontSize: 13,
											textTransform: "uppercase",
											letterSpacing: "-0.01em",
											textAlign: "center",
											lineHeight: 1,
											maxWidth: "100%",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
											width: "100%",
										}}
									>
										{entry.name.split(" ")[0]}
									</span>
									<span
										style={{
											fontFamily: DISPLAY,
											fontWeight: 900,
											fontSize: isFirst ? 26 : 21,
											lineHeight: 1,
											color,
										}}
									>
										{entry.points}
									</span>
									<span
										style={{
											fontFamily: MONO,
											fontSize: 9,
											color: "var(--b-text-3)",
											display: "inline-flex",
											alignItems: "center",
											gap: 3,
										}}
									>
										<Star size={9} style={{ color }} />
										{entry.exacts}
									</span>
									{/* Bloco do pódio */}
									<div
										style={{
											width: "100%",
											height: blockH,
											borderRadius: "10px 10px 0 0",
											marginTop: 2,
											background: `color-mix(in oklch, ${color} 16%, var(--b-card))`,
											border: `1.5px solid ${color}`,
											borderBottom: "none",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											color,
											boxSizing: "border-box",
										}}
									>
										{isFirst ? <Crown size={18} /> : <Medal size={15} />}
									</div>
								</div>
							);
						})}
					</div>

					{/* Lista 4+ */}
					{rest.length > 0 && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: isStory ? 6 : 5,
							}}
						>
							{rest.map((entry) => (
								<div
									key={entry.position}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 10,
										padding: isStory ? "8px 12px" : "6px 10px",
										borderRadius: 14,
										background: "var(--b-card)",
										border: "1px solid var(--b-border-sm)",
									}}
								>
									<span
										style={{
											fontFamily: DISPLAY,
											fontWeight: 900,
											fontSize: 15,
											color: "var(--b-text-3)",
											width: 18,
											textAlign: "center",
										}}
									>
										{entry.position}
									</span>
									<div
										style={{
											width: 28,
											height: 28,
											borderRadius: 999,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontFamily: DISPLAY,
											fontWeight: 800,
											fontSize: 11,
											color: "#fff",
											background: avatarColor(entry.name),
											flexShrink: 0,
										}}
									>
										{initials(entry.name)}
									</div>
									<span
										style={{
											flex: 1,
											minWidth: 0,
											fontFamily: DISPLAY,
											fontWeight: 700,
											fontSize: 14,
											textTransform: "uppercase",
											letterSpacing: "-0.01em",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{entry.name}
									</span>
									<span
										style={{
											fontFamily: MONO,
											fontSize: 11,
											color: "var(--b-text-3)",
											display: "inline-flex",
											alignItems: "center",
											gap: 3,
										}}
									>
										<Star size={10} />
										{entry.exacts}
									</span>
									<span
										style={{
											fontFamily: DISPLAY,
											fontWeight: 900,
											fontSize: 19,
											minWidth: 34,
											textAlign: "right",
										}}
									>
										{entry.points}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Rodapé */}
				<div
					style={{
						paddingTop: 14,
						borderTop: "1px solid var(--b-border-sm)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 10,
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 9 }}>
						<div
							style={{
								width: 30,
								height: 30,
								borderRadius: 9,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "var(--g-brand-diag)",
							}}
						>
							<Trophy size={15} style={{ color: "var(--b-brand-fg)" }} />
						</div>
						<span
							style={{
								fontFamily: DISPLAY,
								fontWeight: 800,
								fontSize: 16,
								textTransform: "uppercase",
								letterSpacing: "-0.01em",
							}}
						>
							Chuta de Bico
						</span>
					</div>
					<span
						style={{
							fontFamily: MONO,
							fontSize: 9,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: "var(--b-text-3)",
						}}
					>
						Pontos · Cravadas
					</span>
				</div>
			</div>
		</div>
	);
});
