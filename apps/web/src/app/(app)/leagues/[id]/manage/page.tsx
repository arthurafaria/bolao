"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { Badge } from "@bolao/ui/components/badge";
import { Button } from "@bolao/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@bolao/ui/components/card";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { cn } from "@bolao/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ManageLeaguePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const leagueId = id as Id<"leagues">;

	const league = useQuery(api.leagues.getById, { leagueId });
	const currentUser = useQuery(api.auth.getCurrentUser);
	const pendingRequests = useQuery(api.leagues.getPendingRequests, {
		leagueId,
	});
	const ranking = useQuery(api.leagues.getRanking, { leagueId });

	const approveRequest = useMutation(api.leagues.approveRequest);
	const rejectRequest = useMutation(api.leagues.rejectRequest);
	const removeMember = useMutation(api.leagues.removeMember);
	const updateLeague = useMutation(api.leagues.update);
	const [scoringMode, setScoringMode] = useState<"DEFAULT" | "CUSTOM">(
		"DEFAULT",
	);
	const [scoreResult, setScoreResult] = useState(5);
	const [scoreGoal, setScoreGoal] = useState(2);
	const [scoreExactBonus, setScoreExactBonus] = useState(1);

	useEffect(() => {
		if (!league || league === null) return;
		setScoringMode(league.scoring ? "CUSTOM" : "DEFAULT");
		setScoreResult(league.scoring?.result ?? 5);
		setScoreGoal(league.scoring?.goal ?? 2);
		setScoreExactBonus(league.scoring?.exactBonus ?? 1);
	}, [league]);

	if (league === undefined || currentUser === undefined) return null;
	if (league === null || currentUser === null) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				Liga não encontrada ou acesso negado
			</div>
		);
	}
	if (league.ownerId !== currentUser._id) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				Acesso negado
			</div>
		);
	}

	async function handleApprove(requestId: Id<"leagueJoinRequests">) {
		try {
			await approveRequest({ requestId });
			toast.success("Membro aprovado!");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function handleReject(requestId: Id<"leagueJoinRequests">) {
		try {
			await rejectRequest({ requestId });
			toast.success("Solicitação rejeitada");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function handleRemove(userId: string) {
		try {
			await removeMember({ leagueId, targetUserId: userId });
			toast.success("Membro removido");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function handleJoinTypeChange(joinType: "OPEN" | "MODERATED") {
		if (league?.joinType === joinType) return;
		try {
			const result = await updateLeague({ leagueId, joinType });
			if (joinType === "OPEN") {
				const approved = result?.approvedRequests ?? 0;
				toast.success(
					approved > 0
						? `Liga agora é aberta! ${approved} solicitação${approved === 1 ? "" : "ões"} pendente${approved === 1 ? "" : "s"} aprovada${approved === 1 ? "" : "s"}.`
						: "Liga agora é aberta — quem tiver o link entra direto.",
				);
			} else {
				toast.success(
					"Liga agora é moderada — novas entradas precisam da sua aprovação.",
				);
			}
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function handleRankingModeChange(rankingMode: "POINTS" | "EXACTS") {
		try {
			await updateLeague({ leagueId, rankingMode });
			toast.success("Critério do ranking atualizado");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function handleScoringSave() {
		try {
			const updateLeagueScoring = updateLeague as unknown as (args: {
				leagueId: Id<"leagues">;
				scoring: { result: number; goal: number; exactBonus: number } | null;
			}) => Promise<unknown>;
			await updateLeagueScoring({
				leagueId,
				scoring:
					scoringMode === "CUSTOM"
						? {
								result: scoreResult,
								goal: scoreGoal,
								exactBonus: scoreExactBonus,
							}
						: null,
			});
			toast.success("Pontuação da liga atualizada");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	const rankingMode = league.rankingMode ?? "POINTS";

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Link href={`/leagues/${id}`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-1.5 h-4 w-4" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="font-bold text-xl">Gerenciar liga</h1>
					<p className="text-muted-foreground text-sm">{league.name}</p>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Tipo de entrada</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-2 sm:grid-cols-2">
						<RankingModeCard
							selected={league.joinType === "OPEN"}
							title="Aberta"
							description="Quem tiver o link ou o código entra na hora, sem aprovação"
							onClick={() => handleJoinTypeChange("OPEN")}
						/>
						<RankingModeCard
							selected={league.joinType === "MODERATED"}
							title="Moderada"
							description="Você aprova cada pedido de entrada antes da pessoa participar"
							onClick={() => handleJoinTypeChange("MODERATED")}
						/>
					</div>
					{league.joinType === "MODERATED" &&
						pendingRequests &&
						pendingRequests.length > 0 && (
							<p className="mt-3 text-[var(--b-text-3)] text-xs leading-relaxed">
								Ao mudar para aberta, as solicitações pendentes são aprovadas
								automaticamente.
							</p>
						)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Critério do ranking</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-2 sm:grid-cols-2">
						<RankingModeCard
							selected={rankingMode === "POINTS"}
							title="Mais pontos"
							description="Ranking pela soma de pontos de todos os palpites"
							onClick={() => handleRankingModeChange("POINTS")}
						/>
						<RankingModeCard
							selected={rankingMode === "EXACTS"}
							title="Mais cravadas"
							description="Ranking por placares exatos; pontos desempatam"
							onClick={() => handleRankingModeChange("EXACTS")}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Pontuação da liga</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2 sm:grid-cols-2">
						<RankingModeCard
							selected={scoringMode === "DEFAULT"}
							title="Padrão do site"
							description="10 no exato, 5 no resultado e bônus por gols"
							onClick={() => setScoringMode("DEFAULT")}
						/>
						<RankingModeCard
							selected={scoringMode === "CUSTOM"}
							title="Personalizada"
							description="Defina quanto vale cada tipo de acerto"
							onClick={() => setScoringMode("CUSTOM")}
						/>
					</div>
					{scoringMode === "CUSTOM" && (
						<div className="grid gap-2 sm:grid-cols-3">
							<ScoringInput
								id="manage-score-result"
								label="Resultado"
								value={scoreResult}
								onChange={setScoreResult}
							/>
							<ScoringInput
								id="manage-score-goal"
								label="Gols/time"
								value={scoreGoal}
								onChange={setScoreGoal}
							/>
							<ScoringInput
								id="manage-score-exact"
								label="Bônus exato"
								value={scoreExactBonus}
								onChange={setScoreExactBonus}
							/>
						</div>
					)}
					<p className="text-[var(--b-text-3)] text-xs leading-relaxed">
						Pesos novos valem para os próximos jogos; pontos já calculados só
						mudam num recálculo geral feito pelo admin do site.
					</p>
					<Button type="button" variant="brand" onClick={handleScoringSave}>
						Salvar pontuação
					</Button>
				</CardContent>
			</Card>

			{pendingRequests && pendingRequests.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							Solicitações pendentes
							<Badge>{pendingRequests.length}</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{pendingRequests.map((req) => (
							<div
								key={req._id}
								className="flex items-center justify-between rounded-lg border border-border p-3"
							>
								<span className="font-medium text-sm">{req.name}</span>
								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={() => handleApprove(req._id)}
										className="h-7 px-2"
									>
										<Check className="h-3.5 w-3.5" />
									</Button>
									<Button
										size="sm"
										variant="danger-solid"
										onClick={() => handleReject(req._id)}
										className="h-7 px-2"
									>
										<X className="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">
						Membros ({league.memberCount})
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{ranking?.map((member) => (
						<div
							key={member._id}
							className="flex items-center justify-between rounded-lg border border-border p-3"
						>
							<div>
								<span className="font-medium text-sm">
									{member.userId === currentUser._id
										? `${member.name} (admin)`
										: member.name}
								</span>
								<p className="text-muted-foreground text-xs">
									{member.totalPoints} pts
								</p>
							</div>
							{member.userId !== currentUser._id && (
								<Button
									size="sm"
									variant="danger-solid"
									onClick={() => handleRemove(member.userId)}
									className="h-7 px-2 text-xs"
								>
									Remover
								</Button>
							)}
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function RankingModeCard({
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
