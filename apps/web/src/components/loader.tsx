import { Trophy } from "lucide-react";

export default function Loader() {
	return (
		<div
			className="flex min-h-[200px] flex-col items-center justify-center gap-4 pt-8"
			role="status"
			aria-label="Carregando"
		>
			<div
				className="flex h-12 w-12 animate-pulse-glow items-center justify-center rounded-2xl"
				style={{
					background: "var(--g-brand-diag)",
					boxShadow: "var(--b-glow-brand)",
				}}
			>
				<Trophy className="h-5 w-5" style={{ color: "var(--b-brand-fg)" }} />
			</div>
			<p className="text-eyebrow text-xs" style={{ color: "var(--b-text-4)" }}>
				Preparando o gramado…
			</p>
		</div>
	);
}
