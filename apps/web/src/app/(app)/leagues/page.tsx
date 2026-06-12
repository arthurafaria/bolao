"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Button } from "@bolao/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@bolao/ui/components/dialog";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { Tag } from "@bolao/ui/components/tag";
import { cn } from "@bolao/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, KeyRound, Plus, Trophy, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type RankingMode = "POINTS" | "EXACTS";
type ScoringMode = "DEFAULT" | "CUSTOM";

function CreateLeagueDialog() {
	const createLeague = useMutation(api.leagues.create);
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [joinType, setJoinType] = useState<"OPEN" | "MODERATED">("OPEN");
	const [rankingMode, setRankingMode] = useState<RankingMode>("POINTS");
	const [scoringMode, setScoringMode] = useState<ScoringMode>("DEFAULT");
	const [scoreResult, setScoreResult] = useState(5);
	const [scoreGoal, setScoreGoal] = useState(2);
	const [scoreExactBonus, setScoreExactBonus] = useState(1);
	const [loading, setLoading] = useState(false);

	function resetForm() {
		setStep(1);
		setName("");
		setDescription("");
		setJoinType("OPEN");
		setRankingMode("POINTS");
		setScoringMode("DEFAULT");
		setScoreResult(5);
		setScoreGoal(2);
		setScoreExactBonus(1);
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) resetForm();
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (name.trim().length < 3) {
			toast.error("Nome deve ter pelo menos 3 caracteres");
			return;
		}
		setLoading(true);
		try {
			const id = await createLeague({
				name,
				description: description || undefined,
				joinType,
				rankingMode,
				scoring:
					scoringMode === "CUSTOM"
						? {
								result: scoreResult,
								goal: scoreGoal,
								exactBonus: scoreExactBonus,
							}
						: undefined,
			});
			toast.success("Liga criada!");
			setOpen(false);
			resetForm();
			router.push(`/leagues/${id}`);
		} catch (err) {
			toast.error((err as Error).message ?? "Erro ao criar liga");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={<Button variant="action" size="lg" />}>
				<Plus className="h-4 w-4" />
				Criar liga
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<span className="font-black font-display text-2xl uppercase tracking-tight">
							Criar nova liga
						</span>
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="mt-3 space-y-5">
					<WizardProgress step={step} />

					{step === 1 && (
						<div className="space-y-4">
							<div className="space-y-1.5">
								<Label htmlFor="league-name">Nome</Label>
								<Input
									id="league-name"
									placeholder="Ex: Família da Copa"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="league-desc">Descrição (opcional)</Label>
								<Input
									id="league-desc"
									placeholder="Descrição da liga"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>
							<Button
								type="button"
								variant="action"
								className="w-full"
								size="lg"
								disabled={name.trim().length < 3}
								onClick={() => setStep(2)}
							>
								Continuar
							</Button>
						</div>
					)}

					{step === 2 && (
						<div className="space-y-4">
							<div className="space-y-1.5">
								<Label>Tipo de entrada</Label>
								<div className="grid grid-cols-2 gap-2">
									{(["OPEN", "MODERATED"] as const).map((type) => (
										<OptionCard
											key={type}
											selected={joinType === type}
											title={type === "OPEN" ? "Aberta" : "Moderada"}
											description={
												type === "OPEN"
													? "Qualquer um com o código entra"
													: "Você aprova cada membro"
											}
											onClick={() => setJoinType(type)}
										/>
									))}
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Button
									type="button"
									variant="outline"
									size="lg"
									onClick={() => setStep(1)}
								>
									Voltar
								</Button>
								<Button
									type="button"
									variant="action"
									size="lg"
									onClick={() => setStep(3)}
								>
									Continuar
								</Button>
							</div>
						</div>
					)}

					{step === 3 && (
						<div className="space-y-4">
							<div className="space-y-1.5">
								<Label>Critério do ranking</Label>
								<div className="grid grid-cols-2 gap-2">
									<OptionCard
										selected={rankingMode === "POINTS"}
										title="Mais pontos"
										description="Ranking pela soma de pontos; cravadas desempatam"
										onClick={() => setRankingMode("POINTS")}
									/>
									<OptionCard
										selected={rankingMode === "EXACTS"}
										title="Mais cravadas"
										description="Dois rankings: pontos e cravadas (só placares exatos; pontos desempatam)"
										onClick={() => setRankingMode("EXACTS")}
									/>
								</div>
							</div>
							<div className="space-y-1.5">
								<Label>Pontuação</Label>
								<div className="grid grid-cols-2 gap-2">
									<OptionCard
										selected={scoringMode === "DEFAULT"}
										title="Padrão do site"
										description="10 no exato, 5 no resultado e bônus por gols"
										onClick={() => setScoringMode("DEFAULT")}
									/>
									<OptionCard
										selected={scoringMode === "CUSTOM"}
										title="Personalizada"
										description="Você define quanto vale cada tipo de acerto"
										onClick={() => setScoringMode("CUSTOM")}
									/>
								</div>
							</div>
							{scoringMode === "CUSTOM" && (
								<div className="grid gap-2 sm:grid-cols-3">
									<ScoringInput
										id="score-result"
										label="Resultado"
										value={scoreResult}
										onChange={setScoreResult}
									/>
									<ScoringInput
										id="score-goal"
										label="Gols/time"
										value={scoreGoal}
										onChange={setScoreGoal}
									/>
									<ScoringInput
										id="score-exact"
										label="Bônus exato"
										value={scoreExactBonus}
										onChange={setScoreExactBonus}
									/>
								</div>
							)}
							<div className="grid grid-cols-2 gap-2">
								<Button
									type="button"
									variant="outline"
									size="lg"
									onClick={() => setStep(2)}
								>
									Voltar
								</Button>
								<Button
									type="submit"
									variant="action"
									loading={loading}
									size="lg"
								>
									Criar liga
								</Button>
							</div>
						</div>
					)}
				</form>
			</DialogContent>
		</Dialog>
	);
}

function WizardProgress({ step }: { step: 1 | 2 | 3 }) {
	return (
		<div className="space-y-2">
			<span className="text-[var(--b-text-3)] text-eyebrow">
				Passo {step} de 3
			</span>
			<div className="grid grid-cols-3 gap-2">
				{[1, 2, 3].map((item) => (
					<span
						key={item}
						className={cn(
							"h-1.5 rounded-full transition-colors duration-[var(--motion-fast)]",
							item <= step ? "bg-[var(--b-brand)]" : "bg-[var(--b-border-md)]",
						)}
					/>
				))}
			</div>
		</div>
	);
}

function OptionCard({
	selected,
	title,
	description,
	onClick,
}: {
	selected: boolean;
	title: string;
	description: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-2xl border p-3 text-left transition-[transform,background] duration-[var(--motion-fast)]",
				"active:scale-[0.97]",
				selected
					? "border-[var(--b-brand)] bg-[var(--b-brand-10)]"
					: "border-[var(--b-border-md)] hover:bg-[var(--b-tint)]",
			)}
		>
			<p
				className={cn(
					"font-bold font-display text-sm uppercase tracking-wide",
					selected ? "text-[var(--b-brand)]" : "text-[var(--b-text)]",
				)}
			>
				{title}
			</p>
			<p className="mt-0.5 text-[var(--b-text-3)] text-xs leading-relaxed">
				{description}
			</p>
		</button>
	);
}

function ScoringInput({
	id,
	label,
	value,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type="number"
				min={0}
				max={20}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</div>
	);
}

function JoinLeagueCard() {
	const joinLeague = useMutation(api.leagues.join);
	const router = useRouter();
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleJoin(e: React.FormEvent) {
		e.preventDefault();
		if (!code.trim()) return;
		setLoading(true);
		try {
			const result = await joinLeague({
				inviteCode: code.trim().toUpperCase(),
			});
			if (result.status === "JOINED") {
				toast.success("Você entrou na liga!");
				router.push(`/leagues/${result.leagueId}`);
			} else {
				toast.success("Solicitação enviada! Aguarde aprovação.");
			}
		} catch (err) {
			toast.error((err as Error).message ?? "Código inválido");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col gap-4 rounded-[28px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 shadow-[var(--b-shadow-card-soft)]">
			<div className="flex items-center gap-3">
				<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--b-brand-12)] text-[var(--b-brand)]">
					<KeyRound className="h-5 w-5" />
				</span>
				<div>
					<span className="text-[var(--b-text-3)] text-eyebrow">
						Tem um convite?
					</span>
					<h3 className="font-bold font-display text-[var(--b-text)] text-base uppercase tracking-tight">
						Entrar por código
					</h3>
				</div>
			</div>
			<form onSubmit={handleJoin} className="flex flex-col gap-2 sm:flex-row">
				<Input
					placeholder="Ex: ABC123"
					value={code}
					onChange={(e) => setCode(e.target.value.toUpperCase())}
					maxLength={6}
					className="text-center font-mono text-base uppercase tracking-[0.4em]"
				/>
				<Button
					type="submit"
					variant="outline"
					disabled={code.length < 6}
					loading={loading}
					size="default"
				>
					Entrar
					<ArrowRight className="h-4 w-4" />
				</Button>
			</form>
		</div>
	);
}

export default function LeaguesPage() {
	const leagues = useQuery(api.leagues.getUserLeagues);

	const totalPoints =
		leagues?.reduce((acc, l) => acc + (l?.myPoints ?? 0), 0) ?? 0;
	const totalLeagues = leagues?.length ?? 0;
	const totalMembers =
		leagues?.reduce((acc, l) => acc + (l?.memberCount ?? 0), 0) ?? 0;

	return (
		<div className="animate-fade-in space-y-7">
			{/* Header editorial */}
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col">
					<span className="text-[var(--b-brand)] text-eyebrow">
						Onde você compete
					</span>
					<h1 className="font-black font-display text-4xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-5xl">
						Suas ligas
					</h1>
					<p className="mt-1 text-[var(--b-text-3)] text-sm">
						Crie um grupo, convide a galera e dispute ponto a ponto.
					</p>
				</div>
				<CreateLeagueDialog />
			</header>

			{/* Stats summary */}
			{leagues !== undefined && totalLeagues > 0 && (
				<div className="grid grid-cols-3 gap-3 rounded-[24px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-4">
					<MiniStat label="Ligas" value={totalLeagues} />
					<MiniStat label="Pontos somados" value={totalPoints} />
					<MiniStat
						label="Adversários"
						value={Math.max(0, totalMembers - totalLeagues)}
					/>
				</div>
			)}

			{/* Join code */}
			<JoinLeagueCard />

			{/* Lista de ligas */}
			<section>
				<header className="mb-4 flex items-end justify-between gap-3">
					<div>
						<span className="text-[var(--b-text-3)] text-eyebrow">
							Suas disputas
						</span>
						<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
							Minhas ligas
						</h2>
					</div>
				</header>

				{leagues === undefined ? (
					<div className="grid gap-3 sm:grid-cols-2">
						<Skeleton className="h-36 rounded-[24px]" />
						<Skeleton className="h-36 rounded-[24px]" />
					</div>
				) : leagues.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
						<Trophy className="h-10 w-10 text-[var(--b-text-4)]" />
						<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
							Sem liga ainda
						</p>
						<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
							Crie uma liga pra disputar com seus amigos ou entre numa existente
							com o código de convite.
						</p>
					</div>
				) : (
					<div
						className="stagger-children grid gap-3 sm:grid-cols-2"
						style={{ ["--d" as string]: "70ms" }}
					>
						{leagues.map((league, i) =>
							league ? (
								<div key={league._id} style={{ ["--i" as string]: i }}>
									<LeagueCard
										href={`/leagues/${league._id}` as Route}
										name={league.name}
										description={league.description}
										memberCount={league.memberCount}
										points={league.myPoints}
										exacts={league.myExacts}
										joinType={league.joinType}
									/>
								</div>
							) : null,
						)}
					</div>
				)}
			</section>
		</div>
	);
}

function MiniStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<span className="font-black font-display text-2xl text-[var(--b-text)] tabular-nums leading-none sm:text-3xl">
				{value}
			</span>
			<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
				{label}
			</span>
		</div>
	);
}

function LeagueCard({
	href,
	name,
	description,
	memberCount,
	points,
	exacts,
	joinType,
}: {
	href: Route;
	name: string;
	description?: string;
	memberCount: number;
	points: number;
	exacts?: number;
	joinType: "OPEN" | "MODERATED";
}) {
	return (
		<Link
			href={href}
			className={cn(
				"group/league flex flex-col gap-4 rounded-[24px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 shadow-[var(--b-shadow-card-soft)]",
				"transition-[transform,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
				"hover:-translate-y-1 hover:shadow-[var(--b-shadow-brand-md)]",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--b-brand-12)] text-[var(--b-brand)]">
						<Trophy className="h-5 w-5" />
					</span>
					<div className="flex flex-col">
						<h3 className="line-clamp-1 font-bold font-display text-[var(--b-text)] text-base uppercase tracking-tight">
							{name}
						</h3>
						<span className="inline-flex items-center gap-1.5 text-[var(--b-text-3)] text-xs">
							<Users className="h-3 w-3" />
							{memberCount} {memberCount === 1 ? "membro" : "membros"}
						</span>
					</div>
				</div>
				<Tag variant={joinType === "OPEN" ? "brand" : "muted"}>
					{joinType === "OPEN" ? "Aberta" : "Moderada"}
				</Tag>
			</div>

			{description && (
				<p className="line-clamp-2 text-[var(--b-text-3)] text-sm leading-relaxed">
					{description}
				</p>
			)}

			<div className="mt-auto flex items-end justify-between gap-2">
				<div className="flex items-end gap-4">
					<div className="flex flex-col">
						<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
							Seus pontos
						</span>
						<span className="font-black font-display text-3xl text-[var(--b-text)] tabular-nums leading-none">
							{points}
						</span>
					</div>
					{exacts !== undefined && (
						<div className="flex flex-col pb-0.5">
							<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
								Cravadas
							</span>
							<span className="font-black font-display text-[var(--b-text-3)] text-xl tabular-nums leading-none">
								{exacts}
							</span>
						</div>
					)}
				</div>
				<span className="inline-flex items-center gap-1 text-[var(--b-brand)] text-xs uppercase tracking-wider transition-transform duration-[var(--motion-base)] group-hover/league:translate-x-0.5">
					Abrir liga
					<ArrowRight className="h-3.5 w-3.5" />
				</span>
			</div>
		</Link>
	);
}
