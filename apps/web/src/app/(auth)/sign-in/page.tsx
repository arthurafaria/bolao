"use client";

import { Button } from "@bolao/ui/components/button";
import { FloatingInput } from "@bolao/ui/components/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
