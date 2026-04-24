import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  num: string;
  title: string;
  caption: string;
  icon: typeof LayoutDashboard;
  accent: string;
  duration: number; // ms
  scene: (progress: number) => JSX.Element;
};

/** Animated mini-UI scenes for each workflow step. progress: 0 → 1 within the step. */
const SceneRepository = (p: number) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
      <span>AI Systems</span>
      <span className="text-primary">+ New</span>
    </div>
    {[
      { name: "Atlas Support Copilot", domain: "Support", risk: "Medium" },
      { name: "Lumen Pricing Optimizer", domain: "Pricing", risk: "High" },
      { name: "Sage Internal Search", domain: "Internal", risk: "Low" },
    ].map((row, i) => {
      const visible = p > i * 0.28;
      return (
        <div
          key={row.name}
          className={cn(
            "flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-xs transition-all duration-500",
            visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{row.name}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{row.domain}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono",
                row.risk === "High" && "bg-rose-500/15 text-rose-300",
                row.risk === "Medium" && "bg-amber-500/15 text-amber-300",
                row.risk === "Low" && "bg-emerald-500/15 text-emerald-300",
              )}
            >
              {row.risk}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

const SceneInterview = (p: number) => {
  const messages = [
    { from: "ai", text: "What's the primary use case for this system?" },
    { from: "user", text: "Drafting support replies grounded in product docs." },
    { from: "ai", text: "Does it interact directly with end customers?" },
    { from: "user", text: "Yes, but every reply is reviewed by an agent." },
    { from: "ai", text: "Got it. Computing inherent risk… Medium." },
  ];
  return (
    <div className="space-y-1.5">
      {messages.map((m, i) => {
        const visible = p > i * 0.18;
        return (
          <div
            key={i}
            className={cn(
              "flex transition-all duration-400",
              m.from === "user" ? "justify-end" : "justify-start",
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-2.5 py-1.5 text-[11px] leading-snug",
                m.from === "ai"
                  ? "border border-border bg-background/70 text-foreground"
                  : "bg-primary/20 text-primary",
              )}
            >
              {m.from === "ai" && (
                <div className="mb-0.5 flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                  <Bot className="h-2.5 w-2.5" /> Aegis
                </div>
              )}
              {m.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SceneDashboard = (p: number) => {
  const stats = [
    { label: "Systems", value: 8, color: "text-sky-400" },
    { label: "High risk", value: 2, color: "text-rose-400" },
    { label: "Controls done", value: 47, color: "text-emerald-400" },
    { label: "Reports", value: 12, color: "text-violet-400" },
  ];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map((s, i) => {
          const v = Math.floor(s.value * Math.min(1, p * 1.4 - i * 0.1));
          return (
            <div key={s.label} className="rounded-md border border-border bg-background/60 p-2">
              <div className={cn("text-base font-semibold tabular-nums", s.color)}>
                {Math.max(0, v)}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-md border border-border bg-background/60 p-2.5">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Risk distribution</span>
          <span className="font-mono">live</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-border">
          <div
            className="bg-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(60, p * 80)}%` }}
          />
          <div
            className="bg-amber-500 transition-all duration-700"
            style={{ width: `${Math.min(25, p * 35)}%` }}
          />
          <div
            className="bg-rose-500 transition-all duration-700"
            style={{ width: `${Math.min(15, p * 20)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const SceneControls = (p: number) => {
  const items = [
    { id: "GOV-001", title: "Governance owner assigned", evidence: true },
    { id: "ROB-001", title: "Robustness test report", evidence: true },
    { id: "SAFE-001", title: "Prompt injection eval", evidence: true },
    { id: "FAIR-001", title: "Fairness sampling protocol", evidence: false },
  ];
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => {
        const filled = p > i * 0.22;
        return (
          <div
            key={it.id}
            className="flex items-center gap-2.5 rounded-md border border-border bg-background/60 px-2.5 py-2 text-[11px]"
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border transition-all duration-300",
                filled
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent",
              )}
            >
              {filled && <CheckCircle2 className="h-3 w-3" />}
            </div>
            <span className="flex-1 text-foreground">{it.title}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{it.id}</span>
            {filled && it.evidence && (
              <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] text-emerald-300">
                evidence
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SceneResidual = (p: number) => {
  // animate inherent High → residual Low as controls land
  const inherent = 78;
  const residual = Math.round(78 - p * 56); // 78 → 22
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Inherent risk</span>
          <span className="font-mono text-rose-300">{inherent} · High</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-rose-500" style={{ width: `${inherent}%` }} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Residual risk (after controls)</span>
          <span
            className={cn(
              "font-mono",
              residual > 60 ? "text-rose-300" : residual > 35 ? "text-amber-300" : "text-emerald-300",
            )}
          >
            {residual} · {residual > 60 ? "High" : residual > 35 ? "Medium" : "Low"}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-full transition-all duration-500",
              residual > 60 ? "bg-rose-500" : residual > 35 ? "bg-amber-500" : "bg-emerald-500",
            )}
            style={{ width: `${residual}%` }}
          />
        </div>
      </div>
      <div className="rounded-md border border-border bg-background/60 px-2.5 py-2 text-[10px] text-muted-foreground">
        <span className="text-foreground">4</span> controls completed with evidence ·{" "}
        <span className="text-foreground">2</span> in progress
      </div>
    </div>
  );
};

const SceneReports = (p: number) => {
  const formats = [
    { label: "PDF", color: "text-rose-300", desc: "Audit-ready" },
    { label: "DOCX", color: "text-sky-300", desc: "Editable" },
    { label: "XLSX", color: "text-emerald-300", desc: "Control matrix" },
  ];
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-background/60 p-2.5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Generating governance report…
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent-violet transition-all duration-300"
            style={{ width: `${Math.min(100, p * 110)}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {formats.map((f, i) => {
          const ready = p > 0.35 + i * 0.18;
          return (
            <div
              key={f.label}
              className={cn(
                "rounded-md border bg-background/60 p-2 text-center transition-all duration-300",
                ready ? "border-primary/40 opacity-100" : "border-border opacity-50",
              )}
            >
              <div className={cn("text-xs font-semibold", f.color)}>{f.label}</div>
              <div className="mt-0.5 text-[9px] text-muted-foreground">{f.desc}</div>
              {ready && (
                <CheckCircle2 className="mx-auto mt-1 h-3 w-3 text-emerald-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STEPS: Step[] = [
  {
    num: "01",
    title: "Register the AI system",
    caption: "Inventory every model with use case, data, and deployment context.",
    icon: ShieldCheck,
    accent: "from-emerald-500/30 to-emerald-500/5",
    duration: 4500,
    scene: SceneRepository,
  },
  {
    num: "02",
    title: "Run the AI-led interview",
    caption: "A guided agent extracts risk-relevant attributes in plain language.",
    icon: Bot,
    accent: "from-violet-500/30 to-violet-500/5",
    duration: 5500,
    scene: SceneInterview,
  },
  {
    num: "03",
    title: "See the inherent risk",
    caption: "A deterministic engine scores risk and routes you to a dashboard.",
    icon: LayoutDashboard,
    accent: "from-sky-500/30 to-sky-500/5",
    duration: 4500,
    scene: SceneDashboard,
  },
  {
    num: "04",
    title: "Apply recommended controls",
    caption: "Auto-generated checklist tied to your risk tier — upload evidence.",
    icon: ClipboardList,
    accent: "from-amber-500/30 to-amber-500/5",
    duration: 4500,
    scene: SceneControls,
  },
  {
    num: "05",
    title: "Watch residual risk drop",
    caption: "Evidence-weighted residual risk recalculates in real time.",
    icon: ShieldAlert,
    accent: "from-rose-500/30 to-rose-500/5",
    duration: 4500,
    scene: SceneResidual,
  },
  {
    num: "06",
    title: "Export the audit-ready report",
    caption: "PDF, DOCX, and XLSX deliverables aligned to NIST AI RMF & ISO 42001.",
    icon: FileText,
    accent: "from-cyan-500/30 to-cyan-500/5",
    duration: 4500,
    scene: SceneReports,
  },
];

const TICK_MS = 60;

export function InteractiveWalkthrough() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0); // ms within current step
  const [playing, setPlaying] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const totalDuration = useMemo(() => STEPS.reduce((a, s) => a + s.duration, 0), []);
  const elapsedTotal = useMemo(
    () => STEPS.slice(0, activeIdx).reduce((a, s) => a + s.duration, 0) + elapsed,
    [activeIdx, elapsed],
  );

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        const stepDur = STEPS[activeIdx].duration;
        const next = prev + TICK_MS;
        if (next >= stepDur) {
          setActiveIdx((i) => (i + 1) % STEPS.length);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, activeIdx]);

  const step = STEPS[activeIdx];
  const stepProgress = Math.min(1, elapsed / step.duration);
  const overallProgress = (elapsedTotal / totalDuration) * 100;
  const Icon = step.icon;

  const goTo = (i: number) => {
    setActiveIdx(i);
    setElapsed(0);
  };

  return (
    <div className="glow-border relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-30" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[280px] w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />

      <div className="relative grid gap-0 lg:grid-cols-[1fr_360px]">
        {/* Stage */}
        <div className="relative flex min-h-[420px] flex-col p-6 sm:p-8">
          {/* Top bar — fake browser chrome */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
              aegis.ai / {step.title.toLowerCase().replace(/\s+/g, "-")}
            </div>
          </div>

          {/* Step header */}
          <div className="mt-6 flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-gradient-to-br",
                step.accent,
              )}
            >
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  Step {step.num}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  of {STEPS.length}
                </span>
              </div>
              <h3 key={step.num} className="mt-1 animate-fade-in text-xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.caption}</p>
            </div>
          </div>

          {/* Scene */}
          <div className="mt-5 flex-1 rounded-xl border border-border bg-background/40 p-4">
            <div key={step.num}>{step.scene(stepProgress)}</div>
          </div>

          {/* Controls + progress */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/70 text-foreground hover:border-primary/50"
              aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveIdx(0);
                setElapsed(0);
                setPlaying(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              aria-label="Restart walkthrough"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent-violet transition-[width] duration-100 ease-linear"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {Math.round(elapsedTotal / 1000)}s / {Math.round(totalDuration / 1000)}s
            </span>
          </div>
        </div>

        {/* Step rail */}
        <div className="border-t border-border bg-background/30 p-4 lg:border-l lg:border-t-0 lg:p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Workflow
          </p>
          <ol className="space-y-1.5">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const active = i === activeIdx;
              const done = i < activeIdx;
              return (
                <li key={s.num}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
                      active
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-background/40 hover:border-primary/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : done
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-background/60 text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {s.num}
                        </span>
                        <p
                          className={cn(
                            "truncate text-[12px] font-medium",
                            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {s.title}
                        </p>
                      </div>
                      {active && (
                        <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full bg-primary transition-[width] duration-100 ease-linear"
                            style={{ width: `${stepProgress * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}