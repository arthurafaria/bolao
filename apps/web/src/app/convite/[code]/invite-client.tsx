"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Button } from "@bolao/ui/components/button";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { ArrowRight, Check, Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PENDING_INVITE_KEY = "pendingInvite";

function joinErrorMessage(error: unknown): string {
	const raw =
		error instanceof ConvexError && typeof error.data === "string"
			? error.data
			: error instanceof Error
				? error.message
				: "";
	const message = raw.toLowerCase();
	if (message.includes("full")) return "Essa liga já está cheia.";
	if (message.includes("already a member"))
		return "Você já faz parte dessa liga.";
	if (message.includes("already pending"))
		return "Seu pedido de entrada já foi enviado. Aguarde a aprovação.";
	if (message.includes("not found"))
		return "Esse convite não é válido. Confira o link com quem te convidou.";
	return "Não foi possível entrar agora. Tente de novo em instantes.";
}

export function InviteClient({ code }: { code: string }) {
	const router = useRouter();
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const preview = useQuery(api.leagues.getInvitePreview, { inviteCode: code });
	const joinLeague = useMutation(api.leagues.join);

	const [joining, setJoining] = useState(false);
	const [requestSent, setRequestSent] = useState(false);

	// Se já é membro, leva direto pra liga
	useEffect(() => {
		if (isAuthenticated && preview?.viewerStatus === "MEMBER") {
			sessionStorage.removeItem(PENDING_INVITE_KEY);
			toast.success("Você já está nessa liga!");
			router.replace(`/leagues/${preview.leagueId}`);
		}
	}, [isAuthenticated, preview, router]);

	function rememberInvite() {
		sessionStorage.setItem(PENDING_INVITE_KEY, code);
	}

	async function handleJoin() {
		if (joining || !preview) return;
		setJoining(true);
		try {
			const result = await joinLeague({ inviteCode: code });
			sessionStorage.removeItem(PENDING_INVITE_KEY);
			if (result.status === "JOINED") {
				toast.success(`Você entrou na liga ${preview.name}! 🎉`);
				router.push(`/leagues/${result.leagueId}`);
			} else {
				setRequestSent(true);
			}
		} catch (error) {
			toast.error(joinErrorMessage(error));
			setJoining(false);
		}
	}

	const loading = authLoading || preview === undefined;
	const isModerated = preview?.joinType === "MODERATED";

	return (
		<div
			className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10"
			style={{ background: "var(--b-bg)" }}
		>
			{/* Ambient gradients */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--b-brand) 14%, transparent), transparent 26%), radial-gradient(circle at 88% 12%, color-mix(in oklch, var(--b-accent) 8%, transparent), transparent 24%)",
				}}
			/>

			<div
				className="relative w-full max-w-md animate-scale-in rounded-[32px] p-7 sm:p-9"
				style={{
					background: "color-mix(in oklch, var(--b-card) 88%, transparent)",
					boxShadow: "var(--b-shadow-float)",
					outline: "1px solid var(--b-border-sm)",
				}}
			>
				{/* Logo */}
				<div className="mb-7 flex items-center gap-2.5">
					<div
						className="flex h-9 w-9 items-center justify-center rounded-xl"
						style={{
							background: "var(--g-brand-diag)",
							boxShadow: "var(--b-shadow-brand-sm)",
						}}
					>
						<Trophy
							className="h-4 w-4"
							style={{ color: "var(--b-brand-fg)" }}
						/>
					</div>
					<span
						className="text-display-sm text-xl"
						style={{ color: "var(--b-text)" }}
					>
						Chuta de Bico
					</span>
				</div>

				{loading ? (
					<div className="space-y-4">
						<Skeleton className="h-5 w-40 rounded-md" />
						<Skeleton className="h-10 w-full rounded-md" />
						<Skeleton className="h-12 w-full rounded-2xl" />
					</div>
				) : preview === null ? (
					<NotFound />
				) : requestSent ? (
					<RequestSent leagueName={preview.name} />
				) : preview.viewerStatus === "MEMBER" ? (
					<div className="py-8 text-center text-[var(--b-text-3)] text-sm">
						Levando você para a liga…
					</div>
				) : (
					<>
						{/* Convite */}
						<p className="text-[var(--b-brand)] text-eyebrow">
							Convite especial
						</p>
						<h1
							className="mt-2 text-balance text-3xl text-display-hero leading-tight"
							style={{ color: "var(--b-text)" }}
						>
							{preview.ownerName ? (
								<>
									<span style={{ color: "var(--b-brand)" }}>
										{preview.ownerName}
									</span>{" "}
									convidou você
								</>
							) : (
								"Você foi convidado"
							)}
						</h1>
						<p
							className="mt-2 text-sm leading-relaxed"
							style={{ color: "var(--b-text-2)" }}
						>
							para participar da liga{" "}
							<strong style={{ color: "var(--b-text)" }}>{preview.name}</strong>{" "}
							no Chuta de Bico.
						</p>

						<div
							className="mt-5 flex items-center gap-2 rounded-2xl px-4 py-3"
							style={{
								background:
									"color-mix(in oklch, var(--b-brand) 8%, transparent)",
								outline:
									"1px solid color-mix(in oklch, var(--b-brand) 25%, transparent)",
							}}
						>
							<Users className="h-4 w-4 text-[var(--b-brand)]" />
							<span className="font-medium text-[var(--b-text-2)] text-sm">
								{preview.memberCount} participante
								{preview.memberCount === 1 ? "" : "s"}
							</span>
						</div>

						{preview.description && (
							<p className="mt-3 text-[var(--b-text-3)] text-sm leading-relaxed">
								{preview.description}
							</p>
						)}

						<div className="mt-7 space-y-3">
							{preview.viewerStatus === "PENDING_REQUEST" ? (
								<PendingNotice />
							) : preview.isFull ? (
								<FullNotice isAuthenticated={isAuthenticated} />
							) : isAuthenticated ? (
								<>
									<Button
										variant="action"
										size="lg"
										className="w-full text-sm uppercase tracking-[0.16em]"
										onClick={handleJoin}
										loading={joining}
									>
										{isModerated ? "Pedir para entrar" : "Entrar na liga"}
										<ArrowRight className="h-4 w-4" />
									</Button>
									{isModerated && (
										<p className="text-center text-[var(--b-text-4)] text-xs">
											O dono da liga precisa aprovar sua entrada.
										</p>
									)}
								</>
							) : (
								<>
									<Link
										href={`/sign-up?redirect=/convite/${code}`}
										onClick={rememberInvite}
										className="block"
									>
										<Button
											variant="action"
											size="lg"
											className="w-full text-sm uppercase tracking-[0.16em]"
										>
											Criar conta para entrar
											<ArrowRight className="h-4 w-4" />
										</Button>
									</Link>
									<p className="text-center text-[var(--b-text-3)] text-sm">
										Já tem conta?{" "}
										<Link
											href={`/sign-in?redirect=/convite/${code}`}
											onClick={rememberInvite}
											className="font-semibold transition-colors hover:text-[var(--b-brand-hi)]"
											style={{ color: "var(--b-brand)" }}
										>
											Entrar
										</Link>
									</p>
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function NotFound() {
	return (
		<div className="text-center">
			<h1
				className="text-balance text-2xl text-display-hero"
				style={{ color: "var(--b-text)" }}
			>
				Convite não encontrado
			</h1>
			<p className="mt-3 text-[var(--b-text-3)] text-sm leading-relaxed">
				O link pode estar errado ou a liga foi encerrada. Peça um novo convite
				para quem te chamou.
			</p>
			<Link href="/" className="mt-6 block">
				<Button variant="action" size="lg" className="w-full">
					Ir para o Chuta de Bico
				</Button>
			</Link>
		</div>
	);
}

function RequestSent({ leagueName }: { leagueName: string }) {
	return (
		<div className="text-center">
			<div
				className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
				style={{
					background: "color-mix(in oklch, var(--b-brand) 12%, transparent)",
				}}
			>
				<Check className="h-7 w-7 text-[var(--b-brand)]" />
			</div>
			<h1
				className="mt-4 text-balance text-2xl text-display-hero"
				style={{ color: "var(--b-text)" }}
			>
				Pedido enviado!
			</h1>
			<p className="mt-3 text-[var(--b-text-3)] text-sm leading-relaxed">
				O dono da liga <strong>{leagueName}</strong> vai analisar seu pedido.
				Enquanto isso, você já pode explorar o Chuta de Bico.
			</p>
			<Link href="/dashboard" className="mt-6 block">
				<Button variant="action" size="lg" className="w-full">
					Ir para o Chuta de Bico
				</Button>
			</Link>
		</div>
	);
}

function PendingNotice() {
	return (
		<>
			<div
				className="flex items-center gap-3 rounded-2xl px-4 py-3"
				style={{ background: "var(--b-tint)" }}
			>
				<Clock className="h-4 w-4 shrink-0 text-[var(--b-text-3)]" />
				<p className="text-[var(--b-text-2)] text-sm">
					Seu pedido já foi enviado. Aguarde a aprovação do dono da liga.
				</p>
			</div>
			<Link href="/leagues" className="block">
				<Button variant="outline" size="lg" className="w-full">
					Ver minhas ligas
				</Button>
			</Link>
		</>
	);
}

function FullNotice({ isAuthenticated }: { isAuthenticated: boolean }) {
	return (
		<>
			<div
				className="flex items-center gap-3 rounded-2xl px-4 py-3"
				style={{ background: "var(--b-tint)" }}
			>
				<Users className="h-4 w-4 shrink-0 text-[var(--b-text-3)]" />
				<p className="text-[var(--b-text-2)] text-sm">
					Essa liga está cheia (50 participantes).
				</p>
			</div>
			<Link href={isAuthenticated ? "/leagues" : "/"} className="block">
				<Button variant="outline" size="lg" className="w-full">
					{isAuthenticated ? "Ver minhas ligas" : "Ir para o Chuta de Bico"}
				</Button>
			</Link>
		</>
	);
}
