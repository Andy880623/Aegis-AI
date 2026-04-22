import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Gauge,
  Lock,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <AppLayout fullWidth>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Animated grid background */}
        <div className="pointer-events-none absolute inset-0 tech-grid" />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] animate-glow-pulse" />
        <div className="pointer-events-none absolute top-40 right-10 h-[320px] w-[320px] rounded-full bg-accent-violet/20 blur-[100px] animate-glow-pulse [animation-delay:1.5s]" />
        <div className="pointer-events-none absolute top-60 left-10 h-[260px] w-[260px] rounded-full bg-accent-cyan/15 blur-[100px] animate-glow-pulse [animation-delay:3s]" />

        <div className="aegis-container relative pt-24 pb-28">
          {/* Status pill */}
          <div className="mx-auto flex w-fit animate-fade-in items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/70" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              <span className="text-foreground">Live</span> · NIST AI RMF · ISO 42001 aligned
            </span>
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl animate-slide-up text-center text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Turn your AI system into a{" "}
            <span className="text-gradient">governed, auditable</span>, and safer system in{" "}
            <span className="relative inline-block">
              10 minutes
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            </span>
            .
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-center text-base leading-relaxed text-muted-foreground [animation-delay:120ms] sm:text-lg">
            Aegis AI interviews your team, evaluates AI risks, and generates a practical internal
            control and validation plan — without slowing your shipping velocity.
          </p>

          <div className="mt-10 flex animate-slide-up flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row">
            <Link to="/interview">
              <Button
                size="lg"
                className="group h-12 gap-2 bg-gradient-to-r from-primary to-accent-violet px-6 text-primary-foreground shadow-[0_0_32px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_48px_-4px_hsl(var(--primary)/0.8)]"
              >
                Start AI Governance Interview
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 gap-2 border-border bg-card/40 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                See how it works
              </Button>
            </a>
          </div>

          {/* Telemetry strip */}
          <div className="mx-auto mt-20 grid max-w-4xl animate-fade-in grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 [animation-delay:400ms] sm:grid-cols-4">
            {[
              { label: "Interview time", value: "~10 min", icon: Zap },
              { label: "Controls generated", value: "12–24", icon: ClipboardCheck },
              { label: "Frameworks", value: "NIST · ISO", icon: ShieldCheck },
              { label: "Reports", value: "3 formats", icon: FileText },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-card/80 px-5 py-4 backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{s.value}</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative border-t border-border bg-background/40">
        <div className="aegis-container py-24">
          <SectionHeader
            eyebrow="Workflow"
            title="From AI use case to governed system, in three steps."
            subtitle="A structured pipeline replaces ad-hoc spreadsheets and review meetings."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <StepCard
              step="01"
              icon={Workflow}
              title="We interview your team"
              description="A guided wizard captures system type, data, automation level, and current testing maturity."
            />
            <StepCard
              step="02"
              icon={Gauge}
              title="We assess risk & gaps"
              description="Deterministic engine produces risk tier and validation gaps across robustness, fairness, safety, and explainability."
            />
            <StepCard
              step="03"
              icon={FileText}
              title="We generate the plan"
              description="A prioritized control checklist plus three downloadable governance documents — ready for audit."
            />
          </div>
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="relative border-t border-border">
        <div className="pointer-events-none absolute inset-0 opacity-[0.4]">
          <div className="absolute inset-0 tech-grid-dense" />
        </div>
        <div className="aegis-container relative py-24">
          <SectionHeader
            eyebrow="Built for"
            title="Teams shipping AI under real-world risk."
            subtitle="Whether you have a dedicated risk function or none at all — Aegis fits in."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BuiltForCard icon={Sparkles} title="AI Product Teams" description="Ship features with embedded governance instead of bolt-on review cycles." />
            <BuiltForCard icon={Activity} title="ML Engineers" description="Get clear, actionable validation requirements tied to your model type." />
            <BuiltForCard icon={ShieldCheck} title="Compliance & Risk" description="Standardized evidence requirements and audit-ready documents." />
            <BuiltForCard icon={Lock} title="Startups" description="Enterprise-grade governance without hiring a dedicated AI risk team." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border">
        <div className="aegis-container py-24">
          <div className="glow-border relative overflow-hidden rounded-2xl bg-card/60 p-10 backdrop-blur sm:p-16">
            <div className="pointer-events-none absolute inset-0 tech-grid opacity-50" />
            <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[280px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
            <div className="relative text-center">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Ready to make your AI system <span className="text-gradient">audit-ready</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Start the interview now — no sign-up required for the demo. Your data stays in your environment.
              </p>
              <Link to="/interview" className="mt-8 inline-flex">
                <Button
                  size="lg"
                  className="group h-12 gap-2 bg-gradient-to-r from-primary to-accent-violet px-6 text-primary-foreground shadow-[0_0_32px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_48px_-4px_hsl(var(--primary)/0.8)]"
                >
                  Start AI Governance Interview
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.4)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-accent-violet/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-primary/5 group-hover:to-accent-violet/5" />
      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-primary transition-colors group-hover:border-primary/40 group-hover:text-primary-glow">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">{step}</span>
      </div>
      <h3 className="relative mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function BuiltForCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur transition-all duration-300 hover:border-primary/40 hover:bg-card/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent-violet/20 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
