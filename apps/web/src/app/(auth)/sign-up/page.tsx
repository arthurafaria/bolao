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
    <div>
      <div className="mb-8">
        <h1
          className="font-display mb-1 text-4xl font-black uppercase leading-tight tracking-tight text-balance"
          style={{ color: "var(--b-text)" }}
        >
          Crie sua<br />conta
        </h1>
        <p style={{ color: "var(--b-text-3)" }}>
          Grátis. Sem cartão. Comece agora.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="space-y-4"
      >
        {[
          { name: "name" as const, label: "Nome", type: "text", placeholder: "Seu nome" },
          { name: "email" as const, label: "Email", type: "email", placeholder: "seu@email.com" },
          { name: "password" as const, label: "Senha", type: "password", placeholder: "Mínimo 8 caracteres" },
        ].map(({ name, label, type, placeholder }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <div className="space-y-1.5">
                <Label
                  htmlFor={name}
                  className="text-sm font-semibold uppercase tracking-wider"
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
                  className="h-11"
                  style={{
                    background: "var(--b-input-bg)",
                    borderColor: "var(--b-border-md)",
                    color: "var(--b-text)",
                  }}
                />
                {field.state.meta.errors[0] && (
                  <p className="text-xs" style={{ color: "oklch(0.67 0.22 22)" }}>
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        ))}

        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="mt-2 h-11 w-full font-display text-base font-bold uppercase tracking-wide"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--b-text-3)" }}>
        Já tem conta?{" "}
        <Link
          href="/sign-in"
          className="font-semibold transition-colors"
          style={{ color: "var(--b-brand)" }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
