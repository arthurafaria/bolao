"use client";
import { Button } from "@bolao/ui/components/button";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { Check, Loader2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

function getSignUpErrorMessage(error: unknown) {
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	if (message.includes("already") || message.includes("exist")) {
		return "Esse email já tem conta. Tente entrar em vez de criar uma nova.";
	}
	if (message.includes("invalidaccountid")) {
		return "Sessão de cadastro antiga detectada. Recarregue a página e tente novamente.";
	}
	if (message.includes("jwt_private_key") || message.includes("jwks")) {
		return "Configuração de autenticação local ausente. As chaves do Convex Auth precisam estar setadas.";
	}
	if (message.includes("password")) {
		return "A senha não foi aceita. Use pelo menos 8 caracteres.";
	}
	return "Erro ao criar conta. Tente novamente.";
}

const benefits = [
	"Cadastre-se em menos de 1 minuto",
	"Crie ou entre em ligas privadas",
	"Acompanhe ranking, pontos e próximos jogos",
];

export default function SignUpPage() {
	const router = useRouter();
	const { signIn } = useAuthActions();

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Mínimo 2 caracteres"),
				email: z.string().email("Email inválido"),
				password: z.string().min(8, "Mínimo 8 caracteres"),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				await signIn("password", {
					name: value.name,
					email: value.email,
					password: value.password,
					flow: "signUp",
				});
				router.push("/dashboard");
			} catch (error) {
				toast.error(getSignUpErrorMessage(error));
			}
		},
	});

	return (
		<div className="space-y-8">
			<div className="space-y-5">
				<div
					className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.22em]"
					style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
				>
					<Sparkles className="h-4 w-4" />
					Crie sua conta
				</div>

				<div className="space-y-3">
					<h1
						className="text-balance font-black font-display text-5xl uppercase leading-none tracking-tight"
						style={{ color: "var(--b-text)" }}
					>
						Entre no jogo
						<br />
						com estilo
					</h1>
					<p
						className="max-w-sm text-pretty leading-relaxed"
						style={{ color: "var(--b-text-2)" }}
					>
						Abra sua conta grátis e comece a disputar ranking, ligas e moral no
						grupo com uma experiência mais organizada.
					</p>
				</div>
			</div>

			<div
				className="rounded-[30px] p-5"
				style={{
					background:
						"linear-gradient(180deg, color-mix(in oklch, var(--b-brand) 10%, var(--b-card)), color-mix(in oklch, var(--b-card) 92%, transparent))",
					boxShadow: "var(--b-shadow-card)",
				}}
			>
				<div className="flex items-start gap-4">
					<div
						className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
						style={{ background: "var(--b-brand)", color: "var(--b-brand-fg)" }}
					>
						<Trophy className="h-5 w-5" />
					</div>
					<div>
						<p
							className="font-display text-2xl uppercase leading-none"
							style={{ color: "var(--b-text)", fontWeight: 800 }}
						>
							Resumo do kickoff
						</p>
						<div className="mt-4 space-y-3">
							{benefits.map((benefit) => (
								<div key={benefit} className="flex items-center gap-3">
									<div
										className="flex h-7 w-7 items-center justify-center rounded-full"
										style={{
											background: "var(--b-card)",
											color: "var(--b-brand)",
										}}
									>
										<Check className="h-4 w-4" />
									</div>
									<span
										className="text-sm leading-relaxed"
										style={{ color: "var(--b-text)" }}
									>
										{benefit}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				{[
					{
						name: "name" as const,
						label: "Nome",
						type: "text",
						placeholder: "Como a galera vai te ver no ranking",
					},
					{
						name: "email" as const,
						label: "Email",
						type: "email",
						placeholder: "voce@bolao.com",
					},
					{
						name: "password" as const,
						label: "Senha",
						type: "password",
						placeholder: "Crie uma senha com 8 caracteres ou mais",
					},
				].map(({ name, label, type, placeholder }) => (
					<form.Field key={name} name={name}>
						{(field) => (
							<div className="space-y-2">
								<Label
									htmlFor={name}
									className="font-semibold text-xs uppercase tracking-[0.22em]"
									style={{ color: "var(--b-text-3)" }}
								>
									{label}
								</Label>
								<Input
									id={name}
									type={type}
									placeholder={placeholder}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="h-13 rounded-[22px] border-0 px-4 text-base shadow-none"
									style={{
										background: "var(--b-input-bg)",
										color: "var(--b-text)",
										boxShadow:
											"inset 0 0 0 1px var(--b-border-md), 0 1px 0 rgb(255 255 255 / 0.35)",
									}}
								/>
								{field.state.meta.errors[0] && (
									<p
										className="text-xs"
										style={{ color: "oklch(0.67 0.22 22)" }}
									>
										{field.state.meta.errors[0]?.message}
									</p>
								)}
							</div>
						)}
					</form.Field>
				))}

				<div
					className="rounded-[26px] px-4 py-3 text-sm leading-relaxed"
					style={{ background: "var(--b-tint)", color: "var(--b-text-3)" }}
				>
					Sem cartão, sem complicação. Entrou, escolheu o torneio e já pode
					começar a palpitar.
				</div>

				<form.Subscribe
					selector={(s) => ({
						canSubmit: s.canSubmit,
						isSubmitting: s.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="mt-2 h-13 w-full rounded-[22px] font-bold font-display text-sm uppercase tracking-[0.18em]"
							disabled={!canSubmit || isSubmitting}
							style={{ boxShadow: "var(--b-shadow-soft)" }}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Criando conta
								</>
							) : (
								"Criar conta grátis"
							)}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p
				className="text-center text-sm leading-relaxed"
				style={{ color: "var(--b-text-3)" }}
			>
				Já tem conta?{" "}
				<Link
					href="/sign-in"
					className="font-semibold transition-colors"
					style={{ color: "var(--b-brand)" }}
				>
					Entrar agora
				</Link>
			</p>
		</div>
	);
}
