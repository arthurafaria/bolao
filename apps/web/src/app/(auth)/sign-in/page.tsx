"use client";

import { Button } from "@bolao/ui/components/button";
import { Input } from "@bolao/ui/components/input";
import { Label } from "@bolao/ui/components/label";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();

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
        const { error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });
        if (error) {
          toast.error(error.message || "Erro ao entrar");
          return;
        }
        router.push("/dashboard");
      } catch {
        toast.error("Erro ao entrar. Tente novamente.");
      }
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-display mb-1 text-4xl font-black uppercase leading-tight tracking-tight text-white"
        >
          Bem-vindo<br />de volta
        </h1>
        <p style={{ color: "oklch(0.54 0.05 145)" }}>
          Entre na sua conta e continue jogando
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="space-y-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.60 0.05 145)" }}
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
                  background: "oklch(0.14 0.03 145)",
                  borderColor: "oklch(1 0 0 / 10%)",
                  color: "white",
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

        <form.Field name="password">
          {(field) => (
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.60 0.05 145)" }}
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
                  background: "oklch(0.14 0.03 145)",
                  borderColor: "oklch(1 0 0 / 10%)",
                  color: "white",
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

        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="mt-2 h-11 w-full font-display text-base font-bold uppercase tracking-wide"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "oklch(0.46 0.04 145)" }}>
        Não tem conta?{" "}
        <Link
          href="/sign-up"
          className="font-semibold transition-colors hover:text-white"
          style={{ color: "oklch(0.70 0.22 145)" }}
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
