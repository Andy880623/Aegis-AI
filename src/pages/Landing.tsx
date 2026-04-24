import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  Lock,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { forwardRef, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { InteractiveWalkthrough } from "@/components/landing/InteractiveWalkthrough";

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
            <Link to="/dashboard">
              <Button
                size="lg"
                className="group h-12 gap-2 bg-gradient-to-r from-primary to-accent-violet px-6 text-primary-foreground shadow-[0_0_32px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_48px_-4px_hsl(var(--primary)/0.8)]"
              >
                Open the demo dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#walkthrough">
              <Button size="lg" variant="outline" className="h-12 gap-2 border-border bg-card/40 backdrop-blur">
                <PlayCircle className="h-4 w-4" />
                Watch the 30-second walkthrough
              </Button>
            </a>
          </div>

          {/* Sample data callout */}
          <div className="mx-auto mt-8 flex max-w-xl animate-fade-in items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-[11px] text-muted-foreground [animation-delay:360ms]">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>
              <span className="text-foreground">Sample data is pre-loaded</span> — Atlas Support
              Copilot, 6 controls, evidence files, and a residual risk score are ready to explore.
            </span>
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

      {/* INTERACTIVE WALKTHROUGH (demo video) */}
      <section id="walkthrough" className="relative border-t border-border bg-background/40">
        <div className="aegis-container py-24">
          <SectionHeader
            eyebrow="Demo video"
            title="Watch the full workflow play out — automatically."
            subtitle="An auto-playing walkthrough of the six steps you'll take, from system registration to audit-ready report. Click any step to jump."
          />
          <div className="mx-auto mt-12 max-w-5xl">
            <InteractiveWalkthrough />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
            Want to try it with real data? The demo system{" "}
            <span className="text-foreground">Atlas Support Copilot</span> is already in your
            workspace — open the dashboard to explore.
          </p>
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

      {/* STEP-BY-STEP WALKTHROUGH (deep dive — from old Introduction page) */}
      <section id="step-by-step" className="relative border-t border-border">
        <div className="aegis-container py-24">
          <SectionHeader
            eyebrow="Step-by-step guide"
            title="What happens on each page."
            subtitle="Six pages, one continuous evidence chain. Click any card to jump straight in."
          />

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STEP_DETAILS.map((step) => (
              <Link to={step.route} key={step.num} className="group">
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/60 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.4)]">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-gradient-to-br ${step.tint} text-foreground`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                      STEP {step.num}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  <ul className="mt-4 space-y-1.5">
                    {step.actions.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open page <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="relative border-t border-border bg-background/40">
        <div className="aegis-container py-24">
          <SectionHeader
            eyebrow="Core capabilities"
            title="What makes Aegis different from a spreadsheet."
            subtitle="A focused stack of governance primitives — not a generic GRC platform."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur transition-all hover:border-primary/40 hover:bg-card/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent-violet/20 text-primary">
                  <c.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEST PRACTICES */}
      <section className="relative border-t border-border">
        <div className="aegis-container py-24">
          <SectionHeader
            eyebrow="Best practices"
            title="Get the most out of the platform."
            subtitle="Four habits that separate a one-time assessment from a living governance program."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
            {BEST_PRACTICES.map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 backdrop-blur"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <tip.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
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
                The demo workspace is already populated. Open the dashboard to explore — or start a fresh interview for your own AI system.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    className="group h-12 gap-2 bg-gradient-to-r from-primary to-accent-violet px-6 text-primary-foreground shadow-[0_0_32px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_48px_-4px_hsl(var(--primary)/0.8)]"
                  >
                    Explore the demo dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link to="/workspace">
                  <Button size="lg" variant="outline" className="h-12 gap-2 border-border bg-card/40 backdrop-blur">
                    <Bot className="h-4 w-4" />
                    Start a new interview
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

const STEP_DETAILS = [
  {
    num: "01",
    icon: ShieldCheck,
    title: "Repository — register the system",
    route: "/systems",
    tint: "from-emerald-500/20 to-emerald-500/5",
    desc: "Inventory every AI system with use case, model provider, data sources, and deployment surface.",
    actions: ["Add a new AI system", "Edit metadata", "Filter by domain or risk"],
  },
  {
    num: "02",
    icon: Bot,
    title: "Inherent Risk — AI-led interview",
    route: "/workspace",
    tint: "from-violet-500/20 to-violet-500/5",
    desc: "A conversational agent extracts risk-relevant attributes and computes the inherent risk tier.",
    actions: ["Conversational intake", "Deterministic scoring", "Validation gap detection"],
  },
  {
    num: "03",
    icon: LayoutDashboard,
    title: "Dashboard — portfolio view",
    route: "/dashboard",
    tint: "from-sky-500/20 to-sky-500/5",
    desc: "See risk distribution, control progress, and recent activity across every registered system.",
    actions: ["Risk distribution", "Activity feed", "Quick navigation"],
  },
  {
    num: "04",
    icon: ClipboardList,
    title: "Controls — apply & evidence",
    route: "/controls",
    tint: "from-amber-500/20 to-amber-500/5",
    desc: "Auto-generated control checklist tied to your risk tier. Upload evidence and mark progress.",
    actions: ["Recommended controls", "Evidence uploader", "Status tracking"],
  },
  {
    num: "05",
    icon: ShieldAlert,
    title: "Residual Risk — evidence-weighted",
    route: "/residual",
    tint: "from-rose-500/20 to-rose-500/5",
    desc: "Recalculates in real time: completed + evidence = 100%, completed alone = 50%, in progress = 25%.",
    actions: ["Live recompute", "Evidence weighting", "Gap analysis"],
  },
  {
    num: "06",
    icon: FileText,
    title: "Reports — export deliverables",
    route: "/reports",
    tint: "from-cyan-500/20 to-cyan-500/5",
    desc: "One-click export of audit-ready PDF, DOCX, and XLSX reports aligned to NIST AI RMF and ISO 42001.",
    actions: ["NIST AI RMF", "ISO 42001", "EU AI Act mapping"],
  },
];

const CAPABILITIES = [
  {
    icon: Database,
    title: "Knowledge Base (RAG)",
    desc: "Built-in regulatory knowledge base — AI cites NIST, ISO, and EU AI Act provisions in responses.",
  },
  {
    icon: Sparkles,
    title: "AI-led interviews",
    desc: "Conversational intake replaces tedious forms and auto-extracts structured profile data.",
  },
  {
    icon: Target,
    title: "Deterministic risk engine",
    desc: "Rule-based scoring — explainable and reproducible, never an opaque AI verdict.",
  },
  {
    icon: CheckCircle2,
    title: "Evidence-driven residual risk",
    desc: "Completed + evidence = 100%, completed alone = 50%, in progress = 25%.",
  },
];

const BEST_PRACTICES = [
  {
    icon: Workflow,
    title: "Walk through all six steps in order",
    desc: "Each step's output feeds the next. First-time users should complete one full pass before iterating.",
  },
  {
    icon: Users,
    title: "Bring stakeholders into the interview",
    desc: "Run the interview with product, engineering, and legal/risk together — accuracy improves dramatically.",
  },
  {
    icon: Zap,
    title: "Keep evidence current",
    desc: "Evidence uploads on the Controls page recompute residual risk live. Refresh after every system change.",
  },
  {
    icon: BookOpen,
    title: "Use the Knowledge Base liberally",
    desc: "When in doubt about a regulatory clause, ask the Knowledge Base — answers cite the actual provisions.",
  },
];

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const StepCard = forwardRef<
  HTMLDivElement,
  {
    step: string;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }
>(function StepCard({ step, icon: Icon, title, description }, ref) {
  return (
    <div ref={ref} className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.4)]">
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
});

const BuiltForCard = forwardRef<
  HTMLDivElement,
  {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }
>(function BuiltForCard({ icon: Icon, title, description }, ref) {
  return (
    <div ref={ref} className="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur transition-all duration-300 hover:border-primary/40 hover:bg-card/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent-violet/20 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
});
