"use client";

import { Button } from "@bolao/ui/components/button";
import { FloatingInput } from "@bolao/ui/components/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Hash, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export default function ForgotPasswordPage() {
	const { signIn } = useAuthActions();
	const router = useRouter();
	const [step, setStep] = useState<"email" | "verify">("email");
	const [resetEmail, setResetEmail] = useState("");

	const emailForm = useForm({
		defaultValues: { email: "" },
		validators: { onSubmit: z.object({ email: z.string().email("Email inválido") }) },
		onSubmit: async ({ value }) => {
			try {
				await signIn("password", { email: value.email, flow: "reset" });
				setResetEmail(value.email);
				setStep("verify");
				toast.success("Código enviado! Verifique seu email.");
			} catch {
				toast.error("Não foi possível enviar o código. Verifique o email.");
			}
		},
	});

	const verifyForm = useForm({
		defaultValues: { code: "", newPassword: "" },
		validators: {
			onSubmit: z.object({
				code: z.string().min(1, "Informe o código"),
				newPassword: z.string().min(8, "Mínimo 8 caracteres"),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				await signIn("password", {
					email: resetEmail,
					code: value.code,
					newPassword: value.newPassword,
					flow: "reset-verification",
				});
				toast.success("Senha redefinida! Entrando…");
				router.push("/dashboard");
			} catch {
				toast.error("Código inválido ou expirado. Tente novamente.");
			}
		},
	});

	if (step === "verify") {
		return (
			<div className="animate-slide-up">
				<div className="mb-8">
					<h1 className="text-display-hero text-4xl" style={{ color: "var(--b-text)" }}>
						Redefinir
						<br />
						<span style={{ color: "var(--b-brand)" }}>senha</span>
					</h1>
					<p className="mt-2 text-sm" style={{ color: "var(--b-text-3)" }}>
						Código enviado para{" "}
						<span style={{ color: "var(--b-brand)" }}>{resetEmail}</span>
					</p>
				</div>

				<form onSubmit={(e) => { e.preventDefault(); verifyForm.handleSubmit(); }} className="space-y-4">
					<verifyForm.Field name="code">
						{(field) => (
							<FloatingInput
								label="Código do email"
								type="text"
								inputMode="numeric"
								icon={<Hash className="h-4 w-4" />}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								error={field.state.meta.errors[0]?.message}
								autoFocus
							/>
						)}
					</verifyForm.Field>

					<verifyForm.Field name="newPassword">
						{(field) => (
							<FloatingInput
								label="Nova senha"
								type="password"
								icon={<Lock className="h-4 w-4" />}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								error={field.state.meta.errors[0]?.message}
							/>
						)}
					</verifyForm.Field>

					<verifyForm.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
						{({ canSubmit, isSubmitting }) => (
							<Button
								type="submit"
								variant="brand"
								size="lg"
								className="mt-2 w-full text-sm uppercase tracking-[0.16em]"
								disabled={!canSubmit}
								loading={isSubmitting}
							>
								Redefinir senha
							</Button>
						)}
					</verifyForm.Subscribe>
				</form>

				<button
					type="button"
					onClick={() => setStep("email")}
					className="mt-5 flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--b-brand)]"
					style={{ color: "var(--b-text-3)" }}
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Usar outro email
				</button>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-display-hero text-4xl" style={{ color: "var(--b-text)" }}>
					Esqueceu
					<br />
					<span style={{ color: "var(--b-brand)" }}>a senha?</span>
				</h1>
				<p className="mt-2 text-sm" style={{ color: "var(--b-text-3)" }}>
					Informe seu email e enviamos um código de recuperação.
				</p>
			</div>

			<form onSubmit={(e) => { e.preventDefault(); emailForm.handleSubmit(); }} className="space-y-4">
				<emailForm.Field name="email">
					{(field) => (
						<FloatingInput
							label="Email"
							type="email"
							icon={<Mail className="h-4 w-4" />}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							error={field.state.meta.errors[0]?.message}
							autoFocus
						/>
					)}
				</emailForm.Field>

				<emailForm.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							variant="brand"
							size="lg"
							className="mt-2 w-full text-sm uppercase tracking-[0.16em]"
							disabled={!canSubmit}
							loading={isSubmitting}
						>
							Enviar código
						</Button>
					)}
				</emailForm.Subscribe>
			</form>

			<p className="mt-6 text-center text-sm" style={{ color: "var(--b-text-3)" }}>
				<Link
					href="/sign-in"
					className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-[var(--b-brand-hi)]"
					style={{ color: "var(--b-brand)" }}
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Voltar para entrar
				</Link>
			</p>
		</div>
	);
}
