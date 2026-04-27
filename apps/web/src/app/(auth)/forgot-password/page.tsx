"use client";

import { Button } from "@bolao/ui/components/button";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Loader2 } from "lucide-react";
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
		validators: {
			onSubmit: z.object({ email: z.string().email("Email inválido") }),
		},
		onSubmit: async ({ value }) => {
			try {
				await signIn("password", { email: value.email, flow: "reset" });
				setResetEmail(value.email);
				setStep("verify");
				toast.success("Código enviado! Verifique seu email.");
			} catch {
				toast.error(
					"Não foi possível enviar o código. Verifique o email e tente novamente.",
				);
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

	const inputCls =
		"h-11 rounded-[14px] border-0 px-4 text-base shadow-none";
	const inputStyle = {
		background: "var(--b-input-bg)",
		color: "var(--b-text)",
		boxShadow:
			"inset 0 0 0 1px var(--b-border-md), 0 1px 0 rgb(255 255 255 / 0.35)",
	};
	const labelCls = "font-semibold text-xs uppercase tracking-[0.22em]";

	if (step === "verify") {
		return (
			<div>
				<div className="mb-8">
					<h1
						className="mb-1 font-black font-display text-3xl uppercase leading-tight tracking-tight"
						style={{ color: "var(--b-text)" }}
					>
						Redefinir senha
					</h1>
					<p className="text-sm" style={{ color: "var(--b-text-3)" }}>
						Código enviado para{" "}
						<span style={{ color: "var(--b-brand)" }}>{resetEmail}</span>
					</p>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						verifyForm.handleSubmit();
					}}
					className="space-y-4"
				>
					<verifyForm.Field name="code">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor="code"
									className={labelCls}
									style={{ color: "var(--b-text-3)" }}
								>
									Código do email
								</Label>
								<Input
									id="code"
									type="text"
									inputMode="numeric"
									placeholder="123456"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className={inputCls}
									style={inputStyle}
									autoFocus
								/>
								{field.state.meta.errors[0] && (
									<p className="text-xs" style={{ color: "oklch(0.67 0.22 22)" }}>
										{field.state.meta.errors[0]?.message}
									</p>
								)}
							</div>
						)}
					</verifyForm.Field>

					<verifyForm.Field name="newPassword">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor="newPassword"
									className={labelCls}
									style={{ color: "var(--b-text-3)" }}
								>
									Nova senha
								</Label>
								<Input
									id="newPassword"
									type="password"
									placeholder="Mínimo 8 caracteres"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className={inputCls}
									style={inputStyle}
								/>
								{field.state.meta.errors[0] && (
									<p className="text-xs" style={{ color: "oklch(0.67 0.22 22)" }}>
										{field.state.meta.errors[0]?.message}
									</p>
								)}
							</div>
						)}
					</verifyForm.Field>

					<verifyForm.Subscribe
						selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
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
										Redefinindo…
									</>
								) : (
									"Redefinir senha"
								)}
							</Button>
						)}
					</verifyForm.Subscribe>
				</form>

				<button
					type="button"
					onClick={() => setStep("email")}
					className="mt-5 flex items-center gap-1.5 text-sm transition-colors"
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
				<h1
					className="mb-1 font-black font-display text-3xl uppercase leading-tight tracking-tight"
					style={{ color: "var(--b-text)" }}
				>
					Esqueceu
					<br />a senha?
				</h1>
				<p className="text-sm" style={{ color: "var(--b-text-3)" }}>
					Informe seu email e enviaremos um código de recuperação.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					emailForm.handleSubmit();
				}}
				className="space-y-4"
			>
				<emailForm.Field name="email">
					{(field) => (
						<div className="space-y-1.5">
							<Label
								htmlFor="email"
								className={labelCls}
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
								className={inputCls}
								style={inputStyle}
								autoFocus
							/>
							{field.state.meta.errors[0] && (
								<p className="text-xs" style={{ color: "oklch(0.67 0.22 22)" }}>
									{field.state.meta.errors[0]?.message}
								</p>
							)}
						</div>
					)}
				</emailForm.Field>

				<emailForm.Subscribe
					selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
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
									Enviando…
								</>
							) : (
								"Enviar código"
							)}
						</Button>
					)}
				</emailForm.Subscribe>
			</form>

			<p
				className="mt-6 text-center text-sm"
				style={{ color: "var(--b-text-3)" }}
			>
				<Link
					href="/sign-in"
					className="flex items-center justify-center gap-1.5 font-semibold transition-colors"
					style={{ color: "var(--b-brand)" }}
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Voltar para entrar
				</Link>
			</p>
		</div>
	);
}
