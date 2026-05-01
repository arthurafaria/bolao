const TEAM_FLAGS = [
	{ name: "Brasil", flag: "🇧🇷" },
	{ name: "Argentina", flag: "🇦🇷" },
	{ name: "França", flag: "🇫🇷" },
	{ name: "Espanha", flag: "🇪🇸" },
	{ name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
	{ name: "Alemanha", flag: "🇩🇪" },
	{ name: "Portugal", flag: "🇵🇹" },
	{ name: "Holanda", flag: "🇳🇱" },
	{ name: "Itália", flag: "🇮🇹" },
	{ name: "Uruguai", flag: "🇺🇾" },
	{ name: "EUA", flag: "🇺🇸" },
	{ name: "México", flag: "🇲🇽" },
	{ name: "Japão", flag: "🇯🇵" },
	{ name: "Coreia", flag: "🇰🇷" },
	{ name: "Marrocos", flag: "🇲🇦" },
	{ name: "Senegal", flag: "🇸🇳" },
];

const doubled = [...TEAM_FLAGS, ...TEAM_FLAGS];

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
				{doubled.map((team, i) => (
					<div
						key={`${team.name}-${i}`}
						className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5"
						style={{
							background: "color-mix(in oklch, var(--b-card) 80%, transparent)",
							border: "1px solid var(--b-border-sm)",
							boxShadow: "var(--b-shadow-soft)",
						}}
					>
						<span className="text-xl leading-none">{team.flag}</span>
						<span
							className="font-semibold text-xs uppercase tracking-wider"
							style={{ color: "var(--b-text-3)" }}
						>
							{team.name}
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
