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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{feature.name}</h1>
            <p className="text-muted-foreground">AI Governance Analysis Results</p>
          </div>
          <Link to={`/reports/${id}`}>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              View Reports
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Panel 1 — Risk Tier */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              AI Risk Tier
            </CardTitle>
            <RiskBadge tier={result.risk_tier} size="lg" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.risk_explanation}</p>
          </CardContent>
        </Card>

        {/* Panel 2 — Validation Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TestTubes className="h-5 w-5 text-muted-foreground" />
              Validation Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                { key: 'robustness' as const, label: 'Robustness' },
                { key: 'fairness' as const, label: 'Fairness' },
                { key: 'safety' as const, label: 'AI Safety' },
                { key: 'explainability' as const, label: 'Explainability' },
              ]).map(g => {
                const isGap = !result.validation_gaps[g.key].startsWith('✅');
                return (
                  <div
                    key={g.key}
                    className={`rounded-lg border p-4 ${
                      isGap ? 'border-risk-high-border bg-risk-high-bg' : 'border-risk-low-border bg-risk-low-bg'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isGap ? (
                        <XCircle className="h-4 w-4 text-risk-high shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0" />
                      )}
                      <span className="font-medium text-sm text-foreground">{g.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{result.validation_gaps[g.key].replace('✅ ', '')}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Panel 3 + 4 — Checklist with expandable details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              AI Governance Controls for Your System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {highPriority.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-risk-high flex items-center gap-1.5 mb-3">
                  🔴 High Priority
                </h3>
                <ChecklistAccordion items={highPriority} />
              </div>
            )}

            {recommended.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-risk-medium flex items-center gap-1.5 mb-3">
                  🟡 Recommended
                </h3>
                <ChecklistAccordion items={recommended} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function ChecklistAccordion({ items }: { items: ChecklistItem[] }) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {items.map(item => (
        <AccordionItem key={item.id} value={item.id} className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              {item.title}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Objective</h4>
              <p className="text-muted-foreground">{item.objective}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Steps to Implement</h4>
              <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                {item.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Suggested Tools</h4>
              <div className="flex flex-wrap gap-1.5">
                {item.tools.map((t, i) => (
                  <span key={i} className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Evidence to Keep</h4>
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
