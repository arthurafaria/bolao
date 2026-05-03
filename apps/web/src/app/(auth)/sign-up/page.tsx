"use client";

import { Button } from "@bolao/ui/components/button";
import { FloatingInput } from "@bolao/ui/components/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { Check, Lock, Mail, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

function getSignUpErrorMessage(error: unknown) {
	if (process.env.NODE_ENV !== "production")
		console.error("[sign-up error]", error);
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	if (message.includes("already") || message.includes("exist"))
		return "Esse email já tem conta. Tente entrar.";
	if (message.includes("invalidaccountid"))
		return "Sessão antiga detectada. Recarregue a página.";
	if (message.includes("jwt_private_key") || message.includes("jwks"))
		return "Configuração de autenticação ausente.";
	if (message.includes("password"))
		return "Senha não aceita. Use pelo menos 8 caracteres.";
	return "Erro ao criar conta. Tente novamente.";
}

function PasswordStrength({ password }: { password: string }) {
	const checks = [
		{ label: "8+ caracteres", ok: password.length >= 8 },
		{ label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
		{ label: "Número", ok: /[0-9]/.test(password) },
	];
	const score = checks.filter((c) => c.ok).length;
	const colors = ["var(--b-danger)", "var(--b-warning)", "var(--b-success)"];
	const labels = ["Fraca", "Média", "Forte"];

	if (!password) return null;

	return (
		<div className="animate-slide-up space-y-2">
			<div className="flex gap-1.5">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="h-1 flex-1 rounded-full transition-all duration-[var(--motion-medium)]"
						style={{
							background: i < score ? colors[score - 1] : "var(--b-border-md)",
						}}
					/>
				))}
			</div>
			<div className="flex items-center justify-between">
				<div className="flex gap-3">
					{checks.map(({ label, ok }) => (
						<span
							key={label}
							className="flex items-center gap-1 text-[10px]"
							style={{ color: ok ? "var(--b-success)" : "var(--b-text-4)" }}
						>
							<Check className="h-3 w-3" />
							{label}
						</span>
					))}
				</div>
				<span
					className="font-semibold text-[10px]"
					style={{ color: score > 0 ? colors[score - 1] : "var(--b-text-4)" }}
				>
					{score > 0 ? labels[score - 1] : ""}
				</span>
			</div>
		</div>
	);
}

const benefits = [
	"Cadastro em menos de 1 minuto",
	"Crie ou entre em ligas privadas",
	"Ranking, pontos e próximos jogos em tempo real",
];

export default function SignUpPage() {
	const router = useRouter();
	const { signIn } = useAuthActions();
	const [password, setPassword] = useState("");

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
		<div className="space-y-7">
			{/* Header */}
			<div>
				<div
					className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1"
					style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
				>
					<Sparkles className="h-3.5 w-3.5" />
					<span className="text-[10px] text-eyebrow">Crie sua conta</span>
				</div>
				<h1
					className="text-balance text-4xl text-display-hero leading-tight"
					style={{ color: "var(--b-text)" }}
				>
					Entre no jogo
					<br />
					<span style={{ color: "var(--b-brand)" }}>com estilo</span>
				</h1>
				<p
					className="mt-2 text-sm leading-relaxed"
					style={{ color: "var(--b-text-3)" }}
				>
					Gratuito. Sem cartão. Pronto em menos de 1 minuto.
				</p>
			</div>

			{/* Benefits */}
			<div
				className="rounded-[22px] p-4"
				style={{
					background: "var(--b-brand-5)",
					outline: "1px solid var(--b-brand-15)",
				}}
			>
				<div className="space-y-2">
					{benefits.map((benefit) => (
						<div key={benefit} className="flex items-center gap-2.5">
							<div
								className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
								style={{
									background: "var(--b-brand-15)",
									color: "var(--b-brand)",
								}}
							>
								<Check className="h-3 w-3" />
							</div>
							<span className="text-sm" style={{ color: "var(--b-text-2)" }}>
								{benefit}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Formulário */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<FloatingInput
							label="Nome"
							type="text"
							icon={<User className="h-4 w-4" />}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							error={field.state.meta.errors[0]?.message}
						/>
					)}
				</form.Field>

				<form.Field name="email">
					{(field) => (
						<FloatingInput
							label="Email"
							type="email"
							icon={<Mail className="h-4 w-4" />}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							error={field.state.meta.errors[0]?.message}
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<div className="space-y-2">
							<FloatingInput
								label="Senha"
								type="password"
								icon={<Lock className="h-4 w-4" />}
								value={field.state.value}
								onChange={(e) => {
									field.handleChange(e.target.value);
									setPassword(e.target.value);
								}}
								error={field.state.meta.errors[0]?.message}
							/>
							<PasswordStrength password={password} />
						</div>
					)}
				</form.Field>

				<form.Subscribe
					selector={(s) => ({
						canSubmit: s.canSubmit,
						isSubmitting: s.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							variant="brand"
							size="lg"
							className="mt-2 w-full text-sm uppercase tracking-[0.16em]"
							disabled={!canSubmit}
							loading={isSubmitting}
						>
							Criar conta grátis
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="text-center text-sm" style={{ color: "var(--b-text-3)" }}>
				Já tem conta?{" "}
				<Link
					href="/sign-in"
					className="font-semibold transition-colors hover:text-[var(--b-brand-hi)]"
					style={{ color: "var(--b-brand)" }}
				>
					Entrar agora
				</Link>
			</p>
		</div>
	);
}
