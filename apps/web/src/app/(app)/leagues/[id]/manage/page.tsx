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
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
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
										variant="destructive"
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
									variant="destructive"
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
