"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Button } from "@bolao/ui/components/button";
import { Input } from "@bolao/ui/components/input";
import { cn } from "@bolao/ui/lib/utils";
import { useAction, useQuery } from "convex/react";
import {
	Archive,
	Lock,
	Pencil,
	RefreshCw,
	ShieldCheck,
	Terminal,
	Zap,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

const ADMIN_EMAIL = "arthurdearaujofaria@gmail.com";

type RunState = "idle" | "running" | "done" | "error";

function ResultLog({
	state,
	result,
}: {
	state: RunState;
	result: string | null;
}) {
	if (!result) return null;
	const isError = state === "error";
	return (
		<pre
			className={cn(
				"mt-3 max-h-64 overflow-auto rounded-xl border bg-[var(--b-inner)] p-3 font-mono text-[11px] leading-relaxed",
				isError
					? "border-[var(--b-danger)/25%] text-[var(--b-danger-fg)]"
					: "border-[var(--b-border-sm)] text-[var(--b-text-3)]",
			)}
		>
			{result}
		</pre>
	);
}

function ActionCard({
	label,
	description,
	icon: Icon,
	onRun,
	tone = "default",
	confirmLabel,
}: {
	label: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	onRun: () => Promise<unknown>;
	tone?: "default" | "danger";
	confirmLabel?: string;
}) {
	const [state, setState] = useState<RunState>("idle");
	const [result, setResult] = useState<string | null>(null);

	async function handleRun() {
		if (confirmLabel && !window.confirm(confirmLabel)) return;
		setState("running");
		setResult(null);
		try {
			const res = await onRun();
			setResult(JSON.stringify(res, null, 2));
			setState("done");
			toast.success(`${label} concluído`);
		} catch (e) {
			setResult((e as Error).message ?? String(e));
			setState("error");
			toast.error(`Falhou: ${label}`);
		}
	}

	return (
		<div className="rounded-[24px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 shadow-[var(--b-shadow-card-soft)]">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					<span
						className={cn(
							"flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
							tone === "danger"
								? "bg-[var(--b-danger-bg)] text-[var(--b-danger)]"
								: "bg-[var(--b-brand-12)] text-[var(--b-brand)]",
						)}
					>
						<Icon className="h-5 w-5" />
					</span>
					<div className="min-w-0">
						<p className="font-bold font-display text-[var(--b-text)] text-sm uppercase tracking-tight">
							{label}
						</p>
						<p className="mt-0.5 text-[var(--b-text-3)] text-xs leading-relaxed">
							{description}
						</p>
					</div>
				</div>
				<Button
					type="button"
					onClick={() => void handleRun()}
					loading={state === "running"}
					variant={tone === "danger" ? "danger-solid" : "brand"}
					size="default"
					className="sm:self-start"
				>
					{state === "running" ? "Rodando…" : "Rodar"}
				</Button>
			</div>
			<ResultLog state={state} result={result} />
		</div>
	);
}

function PatchScoreCard() {
	const patchScore = useAction(api.footballData.adminPatchMatchScore);
	const [homeTeam, setHomeTeam] = useState("");
	const [awayTeam, setAwayTeam] = useState("");
	const [homeScore, setHomeScore] = useState("0");
	const [awayScore, setAwayScore] = useState("0");
	const [state, setState] = useState<RunState>("idle");
	const [result, setResult] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!homeTeam.trim() || !awayTeam.trim()) return;
		if (
			!window.confirm(
				`Corrigir placar pra ${homeTeam.trim()} ${homeScore} × ${awayScore} ${awayTeam.trim()}?`,
			)
		)
			return;
		setState("running");
		setResult(null);
		try {
			const res = await patchScore({
				homeTeamShortName: homeTeam.trim(),
				awayTeamShortName: awayTeam.trim(),
				homeScore: Math.max(0, Number.parseInt(homeScore, 10) || 0),
				awayScore: Math.max(0, Number.parseInt(awayScore, 10) || 0),
			});
			setResult(JSON.stringify(res, null, 2));
			setState("done");
			toast.success("Placar corrigido");
		} catch (e) {
			setResult((e as Error).message ?? String(e));
			setState("error");
			toast.error("Falhou ao corrigir placar");
		}
	}

	return (
		<div className="rounded-[24px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 shadow-[var(--b-shadow-card-soft)]">
			<div className="mb-4 flex items-start gap-3">
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--b-warning-bg)] text-[var(--b-warning-fg)]">
					<Pencil className="h-5 w-5" />
				</span>
				<div>
					<p className="font-bold font-display text-[var(--b-text)] text-sm uppercase tracking-tight">
						Corrigir placar de jogo
					</p>
					<p className="mt-0.5 text-[var(--b-text-3)] text-xs leading-relaxed">
						Sobrescreve o placar final de um jogo já encerrado e recalcula os
						pontos.
					</p>
				</div>
			</div>
			<form onSubmit={handleSubmit} className="space-y-3">
				<div className="grid grid-cols-[1fr_72px] gap-2">
					<Input
						placeholder="Time da casa (ex: Fluminense)"
						value={homeTeam}
						onChange={(e) => setHomeTeam(e.target.value)}
					/>
					<Input
						placeholder="0"
						type="number"
						min={0}
						value={homeScore}
						onChange={(e) => setHomeScore(e.target.value)}
						className="text-center font-bold font-mono"
					/>
					<Input
						placeholder="Time visitante (ex: Chapecoense)"
						value={awayTeam}
						onChange={(e) => setAwayTeam(e.target.value)}
					/>
					<Input
						placeholder="0"
						type="number"
						min={0}
						value={awayScore}
						onChange={(e) => setAwayScore(e.target.value)}
						className="text-center font-bold font-mono"
					/>
				</div>
				<Button
					type="submit"
					variant="brand"
					size="default"
					className="w-full"
					loading={state === "running"}
					disabled={!homeTeam.trim() || !awayTeam.trim()}
				>
					{state === "running" ? "Corrigindo…" : "Corrigir placar"}
				</Button>
			</form>
			<ResultLog state={state} result={result} />
		</div>
	);
}

export default function AdminPage() {
	const currentUser = useQuery(api.auth.getCurrentUser);
	const syncBSA = useAction(api.footballData.adminSyncBSA);
	const syncWC = useAction(api.footballData.adminSyncWC);
	const recompute = useAction(api.predictions.adminRecomputeAll);
	const archiveWC = useAction(api.archives.adminArchiveStandings);

	if (currentUser === undefined) return null;

	if (currentUser?.email !== ADMIN_EMAIL) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
				<Lock className="h-10 w-10 text-[var(--b-text-4)]" />
				<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
					Acesso restrito
				</p>
				<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
					Esta área é só pra admins. Se você é admin e está vendo isso, faça
					login com a conta certa.
				</p>
			</div>
		);
	}

	return (
		<div className="animate-fade-in space-y-7">
			{/* Header */}
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col">
					<span className="text-[var(--b-brand)] text-eyebrow">
						Painel operacional
					</span>
					<h1 className="font-black font-display text-4xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-5xl">
						Admin
					</h1>
					<p className="mt-1 text-[var(--b-text-3)] text-sm">
						Sincronização, recomputação e correção. Cuidado com o que clica.
					</p>
				</div>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--b-brand-10)] px-3 py-1.5 font-bold text-[var(--b-brand)] text-xs uppercase tracking-wider">
					<ShieldCheck className="h-3.5 w-3.5" />
					{currentUser.email}
				</span>
			</header>

			{/* Sincronização */}
			<section>
				<header className="mb-4">
					<span className="text-[var(--b-text-3)] text-eyebrow">
						football-data.org
					</span>
					<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Sincronização
					</h2>
				</header>
				<div className="grid gap-3 lg:grid-cols-2">
					<ActionCard
						label="Resync Brasileirão"
						description="Puxa os jogos dos últimos 7 dias e atualiza placares."
						icon={RefreshCw}
						onRun={syncBSA}
					/>
					<ActionCard
						label="Resync Copa do Mundo"
						description="Puxa toda a base do WC do football-data.org."
						icon={RefreshCw}
						onRun={syncWC}
					/>
				</div>
			</section>

			{/* Recomputo */}
			<section>
				<header className="mb-4">
					<span className="text-[var(--b-text-3)] text-eyebrow">Pontuação</span>
					<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Recomputação
					</h2>
				</header>
				<div className="space-y-3">
					<ActionCard
						label="Arquivar ranking da Copa"
						description="Salva a foto final do ranking de cada liga na Copa 2026. Rode ANTES de zerar os pontos."
						icon={Archive}
						onRun={() => archiveWC({ tournament: "WC2026" })}
						confirmLabel="Arquivar o ranking atual como Copa 2026?"
					/>
					<ActionCard
						label="Recomputar todos os pontos"
						description="Reaplica a fórmula de pontuação em todos os jogos finalizados. Útil após mudar a regra ou corrigir placares em massa."
						icon={Zap}
						onRun={recompute}
						tone="danger"
						confirmLabel="Recomputar pontos de TODOS os jogos finalizados? Isso pode levar alguns segundos."
					/>
				</div>
			</section>

			{/* Correção manual */}
			<section>
				<header className="mb-4">
					<span className="text-[var(--b-text-3)] text-eyebrow">
						Hotfix manual
					</span>
					<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Correção
					</h2>
				</header>
				<PatchScoreCard />
			</section>

			{/* Help footer */}
			<section className="rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-inner)] p-4">
				<div className="flex items-start gap-3">
					<Terminal className="mt-0.5 h-4 w-4 shrink-0 text-[var(--b-text-3)]" />
					<p className="text-[var(--b-text-3)] text-xs leading-relaxed">
						Ações destrutivas pedem confirmação. Logs aparecem inline depois que
						cada ação termina. Em caso de falha, abra os DevTools — o erro
						completo aparece no toast e no card.
					</p>
				</div>
			</section>
		</div>
	);
}
