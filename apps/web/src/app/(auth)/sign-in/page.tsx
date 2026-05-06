"use client";

import { Button } from "@bolao/ui/components/button";
import { FloatingInput } from "@bolao/ui/components/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

function getAuthErrorMessage(error: unknown) {
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	if (message.includes("invalid") || message.includes("credentials"))
		return "Email ou senha inválidos.";
	if (message.includes("verification") || message.includes("token"))
		return "Esse link expirou. Solicite um novo acesso.";
	if (message.includes("rate") || message.includes("too many"))
		return "Muitas tentativas. Tente em alguns minutos.";
	if (message.includes("google") || message.includes("oauth") || message.includes("provider"))
		return "Login com Google indisponível. Tente em instantes ou use email e senha.";
	return "Não foi possível concluir o acesso agora.";
}

export default function SignInPage() {
	const router = useRouter();
	const { signIn } = useAuthActions();
	const [googleLoading, setGoogleLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		if (googleLoading) return;
		setGoogleLoading(true);
		try {
			await signIn("google", { redirectTo: "/dashboard" });
		} catch (error) {
			toast.error(getAuthErrorMessage(error));
			setGoogleLoading(false);
		}
	};

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: {
			onSubmit: z.object({
				email: z.string().email("Email inválido"),
				password: z.string().min(8, "Mínimo 8 caracteres"),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				await signIn("password", {
					email: value.email,
					password: value.password,
					flow: "signIn",
				});
				router.push("/dashboard");
			} catch (error) {
				toast.error(getAuthErrorMessage(error));
			}
		},
	});

	return (
		<div>
			{/* Header */}
			<div className="mb-8">
				<h1
					className="text-balance text-4xl text-display-hero leading-tight"
					style={{ color: "var(--b-text)" }}
				>
					Bem-vindo
					<br />
					<span style={{ color: "var(--b-brand)" }}>de volta</span>
				</h1>
				<p className="mt-2 text-sm" style={{ color: "var(--b-text-3)" }}>
					Entre na sua conta e continue jogando
				</p>
			</div>

			{/* Google Sign In */}
			<button
				type="button"
				onClick={handleGoogleSignIn}
				disabled={googleLoading}
				aria-label="Entrar com Google"
				className="mb-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--b-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--b-brand)] disabled:cursor-not-allowed disabled:opacity-60"
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
				{googleLoading ? "Conectando…" : "Entrar com Google"}
			</button>

			<div className="relative mb-6 flex items-center">
				<div className="flex-1 border-t" style={{ borderColor: "var(--b-border)" }} />
				<span className="mx-3 text-xs" style={{ color: "var(--b-text-4)" }}>ou</span>
				<div className="flex-1 border-t" style={{ borderColor: "var(--b-border)" }} />
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
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
						<FloatingInput
							label="Senha"
							type="password"
							icon={<Lock className="h-4 w-4" />}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							error={field.state.meta.errors[0]?.message}
						/>
					)}
				</form.Field>

				<div className="flex justify-end">
					<Link
						href="/forgot-password"
						className="text-xs transition-colors hover:text-[var(--b-brand)]"
						style={{ color: "var(--b-text-4)" }}
					>
						Esqueci minha senha
					</Link>
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
							variant="brand"
							size="lg"
							className="mt-2 w-full text-sm uppercase tracking-[0.16em]"
							disabled={!canSubmit}
							loading={isSubmitting}
						>
							Entrar
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p
				className="mt-6 text-center text-sm"
				style={{ color: "var(--b-text-3)" }}
			>
				Não tem conta?{" "}
				<Link
					href="/sign-up"
					className="font-semibold transition-colors hover:text-[var(--b-brand-hi)]"
					style={{ color: "var(--b-brand)" }}
				>
					Criar conta
				</Link>
			</p>
		</div>
	);
}
