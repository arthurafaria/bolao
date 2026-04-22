import { buttonVariants } from "@bolao/ui/components/button";
import { Shield, Star, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[oklch(0.09_0.028_145)] text-white">

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Trophy className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold uppercase tracking-wide text-white">
            Bolão 2026
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            style={{ color: "oklch(0.75 0.04 145)" }}
          >
            Entrar
          </Link>
          <Link
            href="/sign-up"
            className={buttonVariants({ size: "sm" })}
          >
            Criar conta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
        style={{
          background: `
            radial-gradient(ellipse 140% 70% at 50% 115%, oklch(0.30 0.20 145 / 0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 15% 0%, oklch(0.22 0.15 145 / 0.25) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 5%, oklch(0.18 0.12 90 / 0.15) 0%, transparent 50%),
            oklch(0.09 0.028 145)
          `,
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.70 0.22 145) 1px, transparent 1px), linear-gradient(90deg, oklch(0.70 0.22 145) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Copa badge */}
        <div
          className="relative mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{
            borderColor: "oklch(0.70 0.22 145 / 0.4)",
            background: "oklch(0.70 0.22 145 / 0.08)",
            color: "oklch(0.78 0.18 145)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: "oklch(0.70 0.22 145)" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: "oklch(0.70 0.22 145)" }}
            />
          </span>
          EUA · México · Canadá — Junho 2026
        </div>

        {/* Headline */}
        <h1
          className="font-display relative mb-6 uppercase leading-[0.88] tracking-tight"
          style={{ fontSize: "clamp(3.8rem, 12vw, 9.5rem)", fontWeight: 900 }}
        >
          <span className="block text-white">Bolão</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, oklch(0.78 0.22 145), oklch(0.88 0.20 90))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            da Copa
          </span>
          <span className="block text-white">2026</span>
        </h1>

        <p
          className="relative mb-10 max-w-md text-lg leading-relaxed"
          style={{ color: "oklch(0.62 0.05 145)" }}
        >
          Preveja o placar dos 104 jogos. Dispute com amigos. Comprove que você entende de futebol.
        </p>

        <div className="relative flex flex-col gap-3 sm:flex-row">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}
            style={{ paddingLeft: "2rem", paddingRight: "2rem", fontSize: "1rem", fontWeight: 700 }}
          >
            Começar agora — é grátis
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline", size: "lg" })}
            style={{
              borderColor: "oklch(1 0 0 / 18%)",
              background: "oklch(1 0 0 / 4%)",
              color: "oklch(0.85 0 0)",
              paddingLeft: "2rem",
              paddingRight: "2rem",
              fontSize: "1rem",
            }}
          >
            Já tenho conta
          </Link>
        </div>

        {/* Stats strip */}
        <div
          className="relative mt-20 flex flex-wrap justify-center gap-x-12 gap-y-4"
          style={{ borderTop: "1px solid oklch(1 0 0 / 8%)", paddingTop: "2rem" }}
        >
          {[
            { num: "104", label: "Jogos" },
            { num: "48", label: "Seleções" },
            { num: "1", label: "Campeão" },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <div
                className="font-display text-5xl font-black leading-none"
                style={{ color: "oklch(0.70 0.22 145)" }}
              >
                {num}
              </div>
              <div className="mt-1 text-sm font-medium uppercase tracking-widest" style={{ color: "oklch(0.48 0.04 145)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 pt-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2
            className="font-display mb-12 text-center text-4xl font-bold uppercase tracking-tight md:text-5xl"
          >
            Como funciona
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Palpite de placar",
                desc: "Preveja o placar exato dos 104 jogos. Acertou o placar? 10 pontos. Acertou o resultado? 5 pontos.",
                color: "oklch(0.70 0.22 145)",
                bg: "oklch(0.70 0.22 145 / 0.08)",
              },
              {
                icon: Users,
                title: "Ligas privadas",
                desc: "Crie uma liga, convide amigos pelo código e dispute o ranking entre vocês.",
                color: "oklch(0.83 0.20 90)",
                bg: "oklch(0.83 0.20 90 / 0.08)",
              },
              {
                icon: Star,
                title: "Tempo real",
                desc: "Placar e pontuação atualizados automaticamente enquanto os jogos acontecem.",
                color: "oklch(0.70 0.22 145)",
                bg: "oklch(0.70 0.22 145 / 0.08)",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="rounded-2xl p-6"
                style={{
                  background: "oklch(0.12 0.028 145)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3 className="mb-2 font-display text-xl font-bold uppercase tracking-tight">
                  {title}
                </h3>
                <p style={{ color: "oklch(0.56 0.05 145)", lineHeight: "1.65" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: "oklch(0.12 0.028 145)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <h2
          className="font-display mb-4 text-4xl font-black uppercase leading-tight md:text-6xl"
        >
          Pronto para{" "}
          <span
            style={{
              background: "linear-gradient(135deg, oklch(0.78 0.22 145), oklch(0.88 0.20 90))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            dominar?
          </span>
        </h2>
        <p className="mb-8 text-lg" style={{ color: "oklch(0.56 0.05 145)" }}>
          Cadastre-se em segundos e comece a fazer seus palpites.
        </p>
        <Link href="/sign-up" className={buttonVariants({ size: "lg" })}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem", fontSize: "1.05rem", fontWeight: 700 }}
        >
          Criar conta grátis
        </Link>
      </section>

      <footer
        className="px-6 py-6 text-center text-sm"
        style={{ color: "oklch(0.36 0.03 145)", borderTop: "1px solid oklch(1 0 0 / 6%)" }}
      >
        Bolão da Copa 2026 — feito pra quem entende de futebol
      </footer>
    </div>
  );
}
