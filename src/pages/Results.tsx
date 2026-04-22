import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAIFeature } from '@/hooks/useAIFeatures';
import { useLatestAssessment } from '@/hooks/useAssessments';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertTriangle,
  ShieldCheck,
  TestTubes,
  ClipboardList,
  FileText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Activity,
  Sparkles,
} from 'lucide-react';
import { runGovernanceAnalysis } from '@/lib/assessment';
import type { InterviewData, GovernanceResult, ChecklistItem } from '@/types/governance';
import { useMemo } from 'react';

function featureToInterview(feature: any): InterviewData {
  const safeguards = feature.safeguards || {};
  return {
    system_name: feature.name,
    system_type: feature.ai_type || 'Machine Learning Model',
    is_customer_facing: feature.is_customer_facing ?? false,
    impact_level: feature.impact_level || 'Low',
    automation_level: feature.autonomy_level || 'Always human reviewed',
    uses_personal_data: (feature.user_data_types || []).includes('sensitive: health/financial/identity'),
    data_sources: feature.data_sources || feature.description || '',
    has_robustness_testing: safeguards.robustness_testing ?? false,
    has_bias_testing: safeguards.bias_testing ?? false,
    has_security_testing: safeguards.security_testing ?? false,
    has_model_card: safeguards.has_model_card ?? false,
  };
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { data: feature, isLoading } = useAIFeature(id || '');
  const { data: assessment } = useLatestAssessment(id || '');

  const result: GovernanceResult | null = useMemo(() => {
    if (!feature) return null;
    const interview = featureToInterview(feature);
    return runGovernanceAnalysis(interview);
  }, [feature]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!feature || !result) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
          <Link to="/interview">
            <Button>Start New Interview</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const highPriority = result.checklist.filter(c => c.priority === 'high');
  const recommended = result.checklist.filter(c => c.priority === 'recommended');

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Governance Report</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{feature.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI Governance Analysis · generated from interview profile
            </p>
          </div>
          <Link to={`/reports/${id}`}>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-[0_0_24px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_32px_-4px_hsl(var(--primary)/0.8)]">
              <FileText className="h-4 w-4" />
              View Reports
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Panel 1 — Risk Tier with donut */}
        <Card className="glow-border relative overflow-hidden border-border bg-card/60 backdrop-blur animate-slide-up">
          <div className="pointer-events-none absolute inset-0 tech-grid opacity-30" />
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/10 blur-[80px]" />
          <CardContent className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
            <RiskDonut tier={result.risk_tier} />
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  AI Risk Tier
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {result.risk_tier} Risk
                <span className={`ml-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 align-middle text-xs font-medium ${
                  result.risk_tier === 'High' ? 'border-risk-high-border bg-risk-high-bg text-risk-high' :
                  result.risk_tier === 'Medium' ? 'border-risk-medium-border bg-risk-medium-bg text-risk-medium' :
                  'border-risk-low-border bg-risk-low-bg text-risk-low'
                }`}>
                  <span className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full ${
                    result.risk_tier === 'High' ? 'text-risk-high' :
                    result.risk_tier === 'Medium' ? 'text-risk-medium' : 'text-risk-low'
                  }`} />
                  Active
                </span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {result.risk_explanation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Panel 2 — Validation Gaps */}
        <Card className="border-border bg-card/60 backdrop-blur animate-slide-up [animation-delay:80ms]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <TestTubes className="h-4 w-4 text-primary" />
              Validation Gaps
              <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                4 dimensions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { key: 'robustness' as const, label: 'Robustness', icon: Activity },
                { key: 'fairness' as const, label: 'Fairness', icon: ShieldCheck },
                { key: 'safety' as const, label: 'AI Safety', icon: AlertTriangle },
                { key: 'explainability' as const, label: 'Explainability', icon: Sparkles },
              ]).map((g, idx) => {
                const isGap = !result.validation_gaps[g.key].startsWith('✅');
                return (
                  <div
                    key={g.key}
                    className={`group relative overflow-hidden rounded-lg border p-4 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up ${
                      isGap
                        ? 'border-risk-high-border/60 bg-risk-high-bg/40 hover:border-risk-high-border'
                        : 'border-risk-low-border/60 bg-risk-low-bg/40 hover:border-risk-low-border'
                    }`}
                    style={{ animationDelay: `${100 + idx * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${
                          isGap ? 'bg-risk-high/15 text-risk-high' : 'bg-risk-low/15 text-risk-low'
                        }`}>
                          <g.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{g.label}</span>
                      </div>
                      {isGap ? (
                        <XCircle className="h-4 w-4 text-risk-high" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-risk-low" />
                      )}
                    </div>
                    {/* status bar */}
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-background/60">
                      <div
                        className={`h-full rounded-full ${isGap ? 'bg-risk-high' : 'bg-risk-low'}`}
                        style={{
                          width: isGap ? '32%' : '100%',
                          animation: 'score-fill 1s cubic-bezier(0.16,1,0.3,1) both',
                          animationDelay: `${200 + idx * 80}ms`,
                        }}
                      />
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {result.validation_gaps[g.key].replace('✅ ', '')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Panel 3 + 4 — Checklist */}
        <Card className="border-border bg-card/60 backdrop-blur animate-slide-up [animation-delay:160ms]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Governance Controls
              <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {result.checklist.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {highPriority.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-risk-high/70" />
                    <span className="relative h-2 w-2 rounded-full bg-risk-high" />
                  </span>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-risk-high">
                    High Priority · {highPriority.length}
                  </h3>
                </div>
                <ChecklistAccordion items={highPriority} />
              </div>
            )}

            {recommended.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-risk-medium" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-risk-medium">
                    Recommended · {recommended.length}
                  </h3>
                </div>
                <ChecklistAccordion items={recommended} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function RiskDonut({ tier }: { tier: 'Low' | 'Medium' | 'High' }) {
  const value = tier === 'High' ? 86 : tier === 'Medium' ? 56 : 22;
  const colorVar = tier === 'High' ? '--risk-high' : tier === 'Medium' ? '--risk-medium' : '--risk-low';
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={`riskGrad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(var(${colorVar}))`} stopOpacity="1" />
            <stop offset="100%" stopColor={`hsl(var(${colorVar}))`} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={`url(#riskGrad-${tier})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 8px hsl(var(${colorVar}) / 0.6))`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-foreground tabular-nums">{value}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

function ChecklistAccordion({ items }: { items: ChecklistItem[] }) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {items.map(item => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="overflow-hidden rounded-lg border border-border bg-background/40 px-4 transition-colors hover:border-primary/30 hover:bg-background/70"
        >
          <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              </span>
              {item.title}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 text-sm">
            <div>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">Objective</h4>
              <p className="text-muted-foreground">{item.objective}</p>
            </div>
            <div>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">Steps to Implement</h4>
              <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                {item.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
            <div>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">Suggested Tools</h4>
              <div className="flex flex-wrap gap-1.5">
                {item.tools.map((t, i) => (
                  <span key={i} className="inline-block rounded-md border border-border bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1.5">Evidence to Keep</h4>
              <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                {item.evidence.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
