const COMPETITIONS = [
	{ name: "Copa do Mundo", code: "FIFA" },
	{ name: "Brasileirão", code: "BR" },
	{ name: "Mais competições em breve", code: "+" },
];

const doubled = [
	...COMPETITIONS,
	...COMPETITIONS,
	...COMPETITIONS,
	...COMPETITIONS,
];

export function LogoMarquee() {
	return (
		<div
			className="relative overflow-hidden py-5"
			style={{
				maskImage:
					"linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
				WebkitMaskImage:
					"linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
			}}
		>
			<div
				className="flex gap-3"
				style={{
					animation: "marquee 28s linear infinite",
					width: "max-content",
				}}
			>
				{doubled.map((competition, i) => (
					<div
						key={`${competition.name}-${i}`}
						className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5"
						style={{
							background: "color-mix(in oklch, var(--b-card) 80%, transparent)",
							border: "1px solid var(--b-border-sm)",
							boxShadow: "var(--b-shadow-soft)",
						}}
					>
						<span
							className="font-black font-mono text-sm leading-none"
							style={{ color: "var(--b-text)" }}
						>
							{competition.code}
						</span>
						<span
							className="font-semibold text-xs uppercase tracking-wider"
							style={{ color: "var(--b-text-3)" }}
						>
							{competition.name}
						</span>
					</div>
				))}
			</div>

			<style>{`
				@keyframes marquee {
					from { transform: translateX(0); }
					to   { transform: translateX(-50%); }
				}
				@media (prefers-reduced-motion: reduce) {
					.marquee-track { animation: none; }
				}
			`}</style>
		</div>
	);
}
