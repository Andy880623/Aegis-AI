import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useCreateInterview } from '@/hooks/useAIFeatures';
import { useRunAssessment } from '@/hooks/useAssessments';
import type { InterviewData, SystemType, ImpactLevel, AutomationLevel } from '@/types/governance';

const TOTAL_STEPS = 4;

const defaultData: InterviewData = {
  system_name: '',
  system_type: 'Machine Learning Model',
  is_customer_facing: false,
  impact_level: 'Low',
  automation_level: 'Always human reviewed',
  uses_personal_data: false,
  data_sources: '',
  has_robustness_testing: false,
  has_bias_testing: false,
  has_security_testing: false,
  has_model_card: false,
};

export default function Interview() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<InterviewData>(defaultData);
  const createInterview = useCreateInterview();
  const runAssessment = useRunAssessment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof InterviewData>(key: K, value: InterviewData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    if (step === 1) return data.system_name.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const feature = await createInterview.mutateAsync(data);
      const assessment = await runAssessment.mutateAsync({ feature, interview: data });
      navigate(`/results/${feature.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</div>

        {/* Step content */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                AI System Basics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">AI System Name *</Label>
                <Input
                  id="name"
                  value={data.system_name}
                  onChange={e => update('system_name', e.target.value)}
                  placeholder="e.g., Customer Support Chatbot"
                />
              </div>

              <div className="space-y-2">
                <Label>What type of system is this?</Label>
                <RadioGroup
                  value={data.system_type}
                  onValueChange={v => update('system_type', v as SystemType)}
                  className="space-y-2"
                >
                  {(['Machine Learning Model', 'LLM Application', 'LLM with RAG'] as SystemType[]).map(t => (
                    <div key={t} className="flex items-center space-x-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={t} id={`type-${t}`} />
                      <Label htmlFor={`type-${t}`} className="cursor-pointer flex-1 font-normal">{t}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Is this system customer-facing?</Label>
                <RadioGroup
                  value={data.is_customer_facing ? 'yes' : 'no'}
                  onValueChange={v => update('is_customer_facing', v === 'yes')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-3 flex-1 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="yes" id="cf-yes" />
                    <Label htmlFor="cf-yes" className="cursor-pointer font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-3 flex-1 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="no" id="cf-no" />
                    <Label htmlFor="cf-no" className="cursor-pointer font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Impact & Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Does this system influence important decisions?</Label>
                <p className="text-xs text-muted-foreground">Credit, pricing, approval, risk scoring, etc.</p>
                <RadioGroup
                  value={data.impact_level}
                  onValueChange={v => update('impact_level', v as ImpactLevel)}
                  className="space-y-2"
                >
                  {(['Low', 'Medium', 'High'] as ImpactLevel[]).map(l => (
                    <div key={l} className="flex items-center space-x-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={l} id={`impact-${l}`} />
                      <Label htmlFor={`impact-${l}`} className="cursor-pointer flex-1 font-normal">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Are decisions fully automated or reviewed by humans?</Label>
                <RadioGroup
                  value={data.automation_level}
                  onValueChange={v => update('automation_level', v as AutomationLevel)}
                  className="space-y-2"
                >
                  {(['Fully automated', 'Human review sometimes', 'Always human reviewed'] as AutomationLevel[]).map(l => (
                    <div key={l} className="flex items-center space-x-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={l} id={`auto-${l}`} />
                      <Label htmlFor={`auto-${l}`} className="cursor-pointer flex-1 font-normal">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Does the system use personal or sensitive data?</Label>
                <RadioGroup
                  value={data.uses_personal_data ? 'yes' : 'no'}
                  onValueChange={v => update('uses_personal_data', v === 'yes')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-3 flex-1 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="yes" id="pd-yes" />
                    <Label htmlFor="pd-yes" className="cursor-pointer font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-3 flex-1 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="no" id="pd-no" />
                    <Label htmlFor="pd-no" className="cursor-pointer font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sources">Main data sources</Label>
                <Textarea
                  id="sources"
                  value={data.data_sources}
                  onChange={e => update('data_sources', e.target.value)}
                  placeholder="e.g., User behavior logs, CRM data, product catalog, public web data..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Current Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: 'has_robustness_testing' as const, label: 'Do you currently perform robustness testing?' },
                { key: 'has_bias_testing' as const, label: 'Do you test for bias or fairness?' },
                { key: 'has_security_testing' as const, label: 'Do you test for AI security risks (prompt injection, adversarial attacks)?' },
                { key: 'has_model_card' as const, label: 'Do you have a Model Card or AI documentation?' },
              ]).map(q => (
                <div key={q.key} className="space-y-2">
                  <Label>{q.label}</Label>
                  <RadioGroup
                    value={data[q.key] ? 'yes' : 'no'}
                    onValueChange={v => update(q.key, v === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border border-border p-3 flex-1 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="yes" id={`${q.key}-yes`} />
                      <Label htmlFor={`${q.key}-yes`} className="cursor-pointer font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border border-border p-3 flex-1 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="no" id={`${q.key}-no`} />
                      <Label htmlFor={`${q.key}-no`} className="cursor-pointer font-normal">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : undefined}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Generate AI Governance Analysis
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
