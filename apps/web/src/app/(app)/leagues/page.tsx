"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Badge } from "@bolao/ui/components/badge";
import { Button } from "@bolao/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@bolao/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@bolao/ui/components/dialog";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function CreateLeagueDialog() {
	const createLeague = useMutation(api.leagues.create);
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [joinType, setJoinType] = useState<"OPEN" | "MODERATED">("OPEN");
	const [loading, setLoading] = useState(false);

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
			});
			toast.success("Liga criada!");
			setOpen(false);
			setName("");
			setDescription("");
			router.push(`/leagues/${id}`);
		} catch (err) {
			toast.error((err as Error).message ?? "Erro ao criar liga");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
				<Plus className="mr-2 h-4 w-4" />
				Nova liga
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Criar nova liga</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="mt-2 space-y-4">
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
					<div className="space-y-1.5">
						<Label>Tipo de entrada</Label>
						<div className="flex gap-3">
							{(["OPEN", "MODERATED"] as const).map((type) => (
								<button
									key={type}
									type="button"
									onClick={() => setJoinType(type)}
									className={`flex-1 rounded-lg border p-3 text-left text-sm transition-colors ${
										joinType === type
											? "border-primary bg-primary/10 text-primary"
											: "border-border"
									}`}
								>
									<p className="font-semibold">
										{type === "OPEN" ? "Aberta" : "Moderada"}
									</p>
									<p className="mt-0.5 text-muted-foreground text-xs">
										{type === "OPEN"
											? "Qualquer um com o código pode entrar"
											: "Você aprova cada membro"}
									</p>
								</button>
							))}
						</div>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Criando..." : "Criar liga"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function JoinLeagueForm() {
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
		<form onSubmit={handleJoin} className="flex gap-2">
			<Input
				placeholder="Código (ex: ABC123)"
				value={code}
				onChange={(e) => setCode(e.target.value.toUpperCase())}
				maxLength={6}
				className="font-mono uppercase tracking-widest"
			/>
			<Button
				type="submit"
				variant="outline"
				disabled={loading || code.length < 6}
			>
				Entrar
			</Button>
		</form>
	);
}

export default function LeaguesPage() {
	const leagues = useQuery(api.leagues.getUserLeagues);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Ligas</h1>
					<p className="text-muted-foreground text-sm">Suas ligas e rankings</p>
				</div>
				<CreateLeagueDialog />
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Entrar por código</CardTitle>
				</CardHeader>
				<CardContent>
					<JoinLeagueForm />
				</CardContent>
			</Card>

			<div>
				<h2 className="mb-3 font-semibold">Minhas ligas</h2>
				{leagues === undefined ? (
					<div className="space-y-3">
						{[1, 2].map((i) => (
							<div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
						))}
					</div>
				) : leagues.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center text-muted-foreground">
							<Trophy className="mx-auto mb-2 h-8 w-8 opacity-40" />
							<p>Você ainda não está em nenhuma liga.</p>
							<p className="mt-1 text-sm">
								Crie uma ou entre com um código de convite.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-3">
						{leagues.map(
							(league) =>
								league && (
									<Link key={league._id} href={`/leagues/${league._id}`}>
										<Card className="cursor-pointer transition-colors hover:bg-muted/40">
											<CardContent className="flex items-center justify-between p-4">
												<div className="flex items-center gap-3">
													<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
														<Trophy className="h-4 w-4" />
													</div>
													<div>
														<p className="font-medium">{league.name}</p>
														<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
															<Users className="h-3 w-3" />
															<span>{league.memberCount} membros</span>
															<Badge variant="outline" className="py-0 text-xs">
																{league.joinType === "OPEN"
																	? "Aberta"
																	: "Moderada"}
															</Badge>
														</div>
													</div>
												</div>
												<Badge variant="secondary">{league.myPoints} pts</Badge>
											</CardContent>
										</Card>
									</Link>
								),
						)}
					</div>
				)}
			</div>
		</div>
	);
}
