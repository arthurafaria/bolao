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

export default function SignUpPage() {
  const router = useRouter();

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
        const { error } = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });
        if (error) {
          toast.error(error.message || "Erro ao criar conta");
          return;
        }
        router.push("/dashboard");
      } catch {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-display mb-1 text-4xl font-black uppercase leading-tight tracking-tight text-white"
        >
          Crie sua<br />conta
        </h1>
        <p style={{ color: "oklch(0.54 0.05 145)" }}>
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
                  style={{ color: "oklch(0.60 0.05 145)" }}
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
        ))}

        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="mt-2 h-11 w-full font-display text-base font-bold uppercase tracking-wide"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Criando..." : "Criar conta"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "oklch(0.46 0.04 145)" }}>
        Já tem conta?{" "}
        <Link
          href="/sign-in"
          className="font-semibold transition-colors hover:text-white"
          style={{ color: "oklch(0.70 0.22 145)" }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
