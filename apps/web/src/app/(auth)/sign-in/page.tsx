"use client";

import { Button } from "@bolao/ui/components/button";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

function getAuthErrorMessage(error: unknown) {
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	if (message.includes("invalid") || message.includes("credentials")) {
		return "Email ou senha inválidos.";
	}
	if (message.includes("verification") || message.includes("token")) {
		return "Esse link expirou. Solicite um novo acesso por email.";
	}
	if (message.includes("rate") || message.includes("too many")) {
		return "Muitas tentativas em pouco tempo. Tente novamente em alguns minutos.";
	}
	return "Não foi possível concluir o acesso agora.";
}

export default function SignInPage() {
	const router = useRouter();
	const { signIn } = useAuthActions();

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
			<div className="mb-8">
				<h1
					className="mb-1 text-balance font-black font-display text-4xl uppercase leading-tight tracking-tight"
					style={{ color: "var(--b-text)" }}
				>
					Bem-vindo
					<br />
					de volta
				</h1>
				<p style={{ color: "var(--b-text-3)" }}>
					Entre na sua conta e continue jogando
				</p>
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
							<div className="space-y-1.5">
								<Label
									htmlFor="email"
									className="font-semibold text-sm uppercase tracking-wider"
									style={{ color: "var(--b-text-3)" }}
								>
									Email
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="seu@email.com"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="h-11"
									style={{
										background: "var(--b-input-bg)",
										borderColor: "var(--b-border-md)",
										color: "var(--b-text)",
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

					<form.Field name="password">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor="password"
									className="font-semibold text-sm uppercase tracking-wider"
									style={{ color: "var(--b-text-3)" }}
								>
									Senha
								</Label>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="h-11"
									style={{
										background: "var(--b-input-bg)",
										borderColor: "var(--b-border-md)",
										color: "var(--b-text)",
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

					<form.Subscribe
						selector={(s) => ({
							canSubmit: s.canSubmit,
							isSubmitting: s.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								type="submit"
								className="mt-2 h-11 w-full font-bold font-display text-base uppercase tracking-wide"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Entrando...
									</>
								) : (
									"Entrar"
								)}
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
					className="font-semibold transition-colors"
					style={{ color: "var(--b-brand)" }}
				>
					Criar conta
				</Link>
			</p>
		</div>
	);
}
