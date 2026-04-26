"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { RefreshCw, Zap } from "lucide-react";
import { useState } from "react";

const ADMIN_EMAIL = "arthurdearaujofaria@gmail.com";

function AdminButton({
	label,
	icon: Icon,
	onRun,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	onRun: () => Promise<unknown>;
}) {
	const [state, setState] = useState<"idle" | "running" | "done" | "error">(
		"idle",
	);
	const [result, setResult] = useState<string | null>(null);

	async function handleClick() {
		setState("running");
		setResult(null);
		try {
			const res = await onRun();
			setResult(JSON.stringify(res, null, 2));
			setState("done");
		} catch (e) {
			setResult((e as Error).message ?? String(e));
			setState("error");
		}
	}

	return (
		<div
			className="rounded-2xl p-5"
			style={{
				background: "var(--b-card)",
				border: "1px solid var(--b-border)",
			}}
		>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Icon className="h-5 w-5 shrink-0" />
					<span
						className="font-semibold text-sm"
						style={{ color: "var(--b-text)" }}
					>
						{label}
					</span>
				</div>
				<button
					type="button"
					onClick={() => void handleClick()}
					disabled={state === "running"}
					className="rounded-xl px-4 py-1.5 font-bold text-sm uppercase tracking-wide transition-[opacity,transform] active:scale-[0.96] disabled:opacity-50"
					style={{
						background: "var(--b-brand)",
						color: "var(--b-brand-fg)",
					}}
				>
					{state === "running" ? "Rodando…" : "Rodar"}
				</button>
			</div>
			{result && (
				<pre
					className="mt-3 overflow-x-auto rounded-xl p-3 font-mono text-xs"
					style={{
						background: "var(--b-inner)",
						color:
							state === "error" ? "oklch(0.67 0.22 22)" : "var(--b-text-3)",
					}}
				>
					{result}
				</pre>
			)}
		</div>
	);
}

export default function AdminPage() {
	const currentUser = useQuery(api.auth.getCurrentUser);
	const syncBSA = useAction(api.footballData.adminSyncBSA);
	const syncWC = useAction(api.footballData.adminSyncWC);
	const recompute = useAction(api.predictions.adminRecomputeAll);

	if (currentUser === undefined) return null;

	if (currentUser?.email !== ADMIN_EMAIL) {
		return (
			<div
				className="rounded-2xl p-12 text-center"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<p style={{ color: "var(--b-text-3)" }}>Acesso restrito.</p>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<h1
				className="font-black font-display text-2xl uppercase tracking-wide"
				style={{ color: "var(--b-text)" }}
			>
				Admin
			</h1>

			<div className="space-y-3">
				<AdminButton
					label="Resync Brasileirão (últimos 7 dias)"
					icon={RefreshCw}
					onRun={syncBSA}
				/>
				<AdminButton
					label="Resync Copa do Mundo"
					icon={RefreshCw}
					onRun={syncWC}
				/>
				<AdminButton
					label="Recomputar pontos (todos os jogos finalizados)"
					icon={Zap}
					onRun={recompute}
				/>
			</div>
		</div>
	);
}
