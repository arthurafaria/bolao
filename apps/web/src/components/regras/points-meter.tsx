"use client";

import { cn } from "@bolao/ui/lib/utils";
import { useState } from "react";

interface PointsTier {
	pts: number;
	label: string;
	desc: string;
	example: { palpite: string; resultado: string };
	color: string;
	bg: string;
}

const TIERS: PointsTier[] = [
	{
		pts: 10,
		label: "Placar exato",
		desc: "Você acertou o resultado e os gols de cada time.",
		example: { palpite: "2 × 1", resultado: "2 × 1" },
		color: "var(--b-gold)",
		bg: "var(--b-gold-bg)",
	},
	{
		pts: 7,
		label: "Resultado + 1 Saldo",
		desc: "Acertou o vencedor e o placar de um dos times.",
		example: { palpite: "2 × 1", resultado: "3 × 1" },
		color: "var(--b-brand-hi)",
		bg: "var(--b-brand-10)",
	},
	{
		pts: 5,
		label: "Acertou Resultado",
		desc: "Acertou o vencedor, mas não a quantidade de gols.",
		example: { palpite: "2 × 1", resultado: "3 × 0" },
		color: "var(--b-brand)",
		bg: "var(--b-brand-5)",
	},
	{
		pts: 2,
		label: "Só o Saldo",
		desc: "Acertou apenas a quantidade de gols de um time, errou o resultado.",
		example: { palpite: "2 × 1", resultado: "0 × 1" },
		color: "var(--b-warning-fg)",
		bg: "var(--b-warning-bg)",
	},
	{
		pts: 0,
		label: "Errou",
		desc: "Nem o vencedor você acertou.",
		example: { palpite: "2 × 1", resultado: "0 × 3" },
		color: "var(--b-text-4)",
		bg: "var(--b-tint-md)",
	},
];

export function PointsMeter({ className }: { className?: string }) {
	const [active, setActive] = useState<number>(10);
	const tier = TIERS.find((t) => t.pts === active) ?? TIERS[0];

	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-[28px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 shadow-[var(--b-shadow-card-soft)]",
				className,
			)}
		>
			{/* Tier chips */}
			<div className="flex flex-wrap gap-2">
				{TIERS.map((t) => {
					const isActive = t.pts === active;
					return (
						<button
							key={t.pts}
							type="button"
							onClick={() => setActive(t.pts)}
							className={cn(
								"flex flex-col items-center gap-0.5 rounded-2xl border px-4 py-2.5 text-left transition-[transform,box-shadow] duration-[var(--motion-fast)]",
								"hover:-translate-y-0.5 active:scale-[0.97]",
								isActive
									? "shadow-[var(--b-shadow-brand-sm)]"
									: "border-[var(--b-border-sm)]",
							)}
							style={{
								background: isActive ? t.bg : "var(--b-card)",
								borderColor: isActive ? t.color : "var(--b-border-sm)",
							}}
						>
							<span
								className="font-black font-display text-2xl tabular-nums leading-none"
								style={{ color: t.color }}
							>
								{t.pts}
							</span>
							<span className="text-[10px] text-[var(--b-text-3)] uppercase tracking-wider">
								pts
							</span>
						</button>
					);
				})}
			</div>

			{/* Tier detail */}
			<div
				className="flex animate-fade-in flex-col gap-3 rounded-2xl border p-4"
				key={tier.pts}
				style={{
					background: tier.bg,
					borderColor: `color-mix(in oklch, ${tier.color} 30%, transparent)`,
				}}
			>
				<div className="flex items-center gap-3">
					<span
						className="font-black font-display text-4xl tabular-nums leading-none"
						style={{ color: tier.color }}
					>
						{tier.pts}
					</span>
					<div className="flex flex-col">
						<span
							className="font-bold font-display text-base uppercase tracking-tight"
							style={{ color: "var(--b-text)" }}
						>
							{tier.label}
						</span>
						<span className="text-[var(--b-text-3)] text-xs leading-relaxed">
							{tier.desc}
						</span>
					</div>
				</div>
				<div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--b-card)] p-3 font-mono text-sm">
					<div className="flex flex-col items-start">
						<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
							Seu palpite
						</span>
						<span className="font-black font-display text-2xl text-[var(--b-text)] tabular-nums">
							{tier.example.palpite}
						</span>
					</div>
					<span className="text-[var(--b-text-4)] text-xs uppercase tracking-widest">
						vs
					</span>
					<div className="flex flex-col items-end">
						<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
							Resultado real
						</span>
						<span className="font-black font-display text-2xl text-[var(--b-text)] tabular-nums">
							{tier.example.resultado}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
