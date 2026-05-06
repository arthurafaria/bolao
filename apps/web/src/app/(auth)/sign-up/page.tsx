"use client";

import { Button } from "@bolao/ui/components/button";
import { FloatingInput } from "@bolao/ui/components/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Check, KeyRound, Lock, Mail, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
	if (message.includes("google") || message.includes("oauth") || message.includes("provider"))
		return "Login com Google indisponível. Tente em instantes ou use email e senha.";
	if (message.includes("password"))
		return "Senha não aceita. Use pelo menos 8 caracteres.";
	if (message.includes("resend") || message.includes("email"))
		return "Não conseguimos enviar o email agora. Tente novamente.";
	return "Erro ao criar conta. Tente novamente.";
}

function getVerifyErrorMessage(error: unknown) {
	if (process.env.NODE_ENV !== "production")
		console.error("[verify error]", error);
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	if (message.includes("expired") || message.includes("invalid"))
		return "Código inválido ou expirado. Peça um novo.";
	return "Não foi possível confirmar o código. Tente de novo.";
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

type Step = "form" | "verify";
type PendingCredentials = { name: string; email: string; password: string };

export default function SignUpPage() {
	const router = useRouter();
	const { signIn } = useAuthActions();
	const [password, setPassword] = useState("");
	const [googleLoading, setGoogleLoading] = useState(false);
	const [step, setStep] = useState<Step>("form");
	const [pending, setPending] = useState<PendingCredentials | null>(null);
	const [code, setCode] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
		return () => clearTimeout(t);
	}, [resendCooldown]);

	const handleGoogleSignIn = async () => {
		if (googleLoading) return;
		setGoogleLoading(true);
		try {
			await signIn("google", { redirectTo: "/dashboard" });
		} catch (error) {
			toast.error(getSignUpErrorMessage(error));
			setGoogleLoading(false);
		}
	};

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
				setPending(value);
				setStep("verify");
				setResendCooldown(30);
				toast.success("Código enviado! Confere seu email.");
			} catch (error) {
				toast.error(getSignUpErrorMessage(error));
			}
		},
	});

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!pending || verifying) return;
		if (code.length !== 6) {
			toast.error("Digite o código de 6 dígitos.");
			return;
		}
		setVerifying(true);
		try {
			await signIn("password", {
				email: pending.email,
				code,
				flow: "email-verification",
			});
			router.push("/dashboard");
		} catch (error) {
			toast.error(getVerifyErrorMessage(error));
			setVerifying(false);
		}
	};

	const handleResendCode = async () => {
		if (!pending || resendCooldown > 0) return;
		try {
			await signIn("password", {
				name: pending.name,
				email: pending.email,
				password: pending.password,
				flow: "signUp",
			});
			setResendCooldown(30);
			toast.success("Novo código enviado.");
		} catch (error) {
			toast.error(getSignUpErrorMessage(error));
		}
	};

	if (step === "verify" && pending) {
		return (
			<div className="space-y-7">
				<button
					type="button"
					onClick={() => {
						setStep("form");
						setCode("");
					}}
					className="inline-flex cursor-pointer items-center gap-2 text-xs transition-colors hover:text-[var(--b-text-2)]"
					style={{ color: "var(--b-text-4)" }}
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Voltar
				</button>

				<div>
					<div
						className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1"
						style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
					>
						<Mail className="h-3.5 w-3.5" />
						<span className="text-[10px] text-eyebrow">Verifique seu email</span>
					</div>
					<h1
						className="text-balance text-4xl text-display-hero leading-tight"
						style={{ color: "var(--b-text)" }}
					>
						Confirma o<br />
						<span style={{ color: "var(--b-brand)" }}>código</span>
					</h1>
					<p
						className="mt-2 text-sm leading-relaxed"
						style={{ color: "var(--b-text-3)" }}
					>
						Enviamos um código de 6 dígitos pra{" "}
						<span style={{ color: "var(--b-text)" }}>{pending.email}</span>. Pode
						demorar até 1 minuto.
					</p>
				</div>

				<form onSubmit={handleVerify} className="space-y-4">
					<FloatingInput
						label="Código de 6 dígitos"
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						icon={<KeyRound className="h-4 w-4" />}
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
					/>

					<Button
						type="submit"
						variant="brand"
						size="lg"
						className="mt-2 w-full text-sm uppercase tracking-[0.16em]"
						disabled={code.length !== 6 || verifying}
						loading={verifying}
					>
						Confirmar e entrar
					</Button>
				</form>

				<div className="text-center text-sm" style={{ color: "var(--b-text-3)" }}>
					Não recebeu?{" "}
					<button
						type="button"
						onClick={handleResendCode}
						disabled={resendCooldown > 0}
						className="cursor-pointer font-semibold transition-colors hover:text-[var(--b-brand-hi)] disabled:cursor-not-allowed disabled:opacity-60"
						style={{ color: "var(--b-brand)" }}
					>
						{resendCooldown > 0
							? `Reenviar em ${resendCooldown}s`
							: "Reenviar código"}
					</button>
				</div>
			</div>
		);
	}

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

			{/* Google Sign Up */}
			<button
				type="button"
				onClick={handleGoogleSignIn}
				disabled={googleLoading}
				aria-label="Criar conta com Google"
				className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--b-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--b-brand)] disabled:cursor-not-allowed disabled:opacity-60"
				style={{
					borderColor: "var(--b-border-md)",
					color: "var(--b-text-2)",
					background: "var(--b-surface)",
				}}
			>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					<path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
					<path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
					<path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
					<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
				</svg>
				{googleLoading ? "Conectando…" : "Criar conta com Google"}
			</button>

			<div className="relative flex items-center">
				<div className="flex-1 border-t" style={{ borderColor: "var(--b-border)" }} />
				<span className="mx-3 text-xs" style={{ color: "var(--b-text-4)" }}>ou</span>
				<div className="flex-1 border-t" style={{ borderColor: "var(--b-border)" }} />
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
