import { useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAIFeature, useDeleteAIFeature } from '@/hooks/useAIFeatures';
import { useLatestAssessment, useRunAssessment } from '@/hooks/useAssessments';
import { useReport, useGenerateReport } from '@/hooks/useReports';
import { RiskBadge } from '@/components/ui/risk-badge';
import { StageBadge } from '@/components/ui/stage-badge';
import { ScoreBar } from '@/components/ui/score-bar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  Check, 
  AlertTriangle, 
  Info,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';

export default function FeatureDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { data: feature, isLoading: featureLoading } = useAIFeature(id || '');
  const { data: assessment, isLoading: assessmentLoading } = useLatestAssessment(id || '');
  const { data: report } = useReport(id || '', assessment?.id);
  
  const runAssessment = useRunAssessment();
  const generateReport = useGenerateReport();
  const deleteFeature = useDeleteAIFeature();

  // Auto-run assessment if requested
  useEffect(() => {
    if (searchParams.get('runAssessment') === 'true' && feature && !assessment) {
      runAssessment.mutate(feature);
      // Clear the search param
      navigate(`/feature/${id}`, { replace: true });
    }
  }, [searchParams, feature, assessment, id, navigate]);

  const handleRunAssessment = () => {
    if (feature) {
      runAssessment.mutate(feature);
    }
  };

  const handleGenerateReport = () => {
    if (feature && assessment) {
      generateReport.mutate({ feature, assessment });
    }
  };

  const handleDelete = async () => {
    if (id) {
      await deleteFeature.mutateAsync(id);
      navigate('/');
    }
  };

  if (featureLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!feature) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Feature Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested AI feature could not be found.</p>
          <Link to="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{feature.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <StageBadge stage={feature.stage} />
                {assessment && <RiskBadge tier={assessment.risk_tier} />}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRunAssessment}
              disabled={runAssessment.isPending}
              variant="outline"
              className="gap-2"
            >
              {runAssessment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {assessment ? 'Re-run Assessment' : 'Run Assessment'}
            </Button>
            
            {assessment && (
              <Link to={`/feature/${id}/report`}>
                <Button 
                  onClick={(e) => {
                    if (!report) {
                      e.preventDefault();
                      handleGenerateReport();
                    }
                  }}
                  disabled={generateReport.isPending}
                  className="gap-2"
                >
                  {generateReport.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Generate Summary
                </Button>
              </Link>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete AI Feature?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{feature.name}" and all associated assessments and reports.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Product/Service</p>
                <p className="font-medium">{feature.product_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <p className="font-medium">{feature.team || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Type</p>
                <p className="font-medium">{feature.ai_type || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model Source</p>
                <p className="font-medium">{feature.model_source || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Autonomy Level</p>
                <p className="font-medium">{feature.autonomy_level || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(feature.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {feature.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{feature.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data & Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data & Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">User Data Types</p>
                {feature.user_data_types.length > 0 ? (
                  <ul className="space-y-1">
                    {feature.user_data_types.map(type => (
                      <li key={type} className="text-sm">• {type}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Target Users</p>
                {feature.target_users.length > 0 ? (
                  <ul className="space-y-1">
                    {feature.target_users.map(type => (
                      <li key={type} className="text-sm">• {type}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">External Data Transfer</p>
                <p className={feature.external_data_transfer ? 'text-risk-medium font-medium' : ''}>
                  {feature.external_data_transfer ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Impact Types</p>
                {feature.impact_types.length > 0 ? (
                  <ul className="space-y-1">
                    {feature.impact_types.map(type => (
                      <li key={type} className="text-sm">• {type}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safeguards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Safeguards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {feature.safeguards.human_oversight ? (
                  <Check className="h-5 w-5 text-risk-low" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={feature.safeguards.human_oversight ? '' : 'text-muted-foreground'}>
                  Human Oversight
                </span>
              </div>
              <div className="flex items-center gap-2">
                {feature.safeguards.logging_monitoring ? (
                  <Check className="h-5 w-5 text-risk-low" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={feature.safeguards.logging_monitoring ? '' : 'text-muted-foreground'}>
                  Logging & Monitoring
                </span>
              </div>
              <div className="flex items-center gap-2">
                {feature.safeguards.abuse_mitigation ? (
                  <Check className="h-5 w-5 text-risk-low" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={feature.safeguards.abuse_mitigation ? '' : 'text-muted-foreground'}>
                  Abuse Mitigation
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Results */}
        {assessmentLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : assessment ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Assessment Results</CardTitle>
                  <RiskBadge tier={assessment.risk_tier} size="lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Why this risk tier */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Why this risk tier?
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {assessment.rationale.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* Category Scores */}
                <div>
                  <h4 className="font-medium mb-4">Category Scores</h4>
                  <div className="grid gap-4">
                    <ScoreBar label="Privacy" score={assessment.category_scores.privacy} />
                    <ScoreBar label="Safety & Misuse" score={assessment.category_scores.safety_misuse} />
                    <ScoreBar label="Fairness" score={assessment.category_scores.fairness} />
                    <ScoreBar label="Transparency" score={assessment.category_scores.transparency} />
                    <ScoreBar label="Accountability" score={assessment.category_scores.accountability} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gaps & Recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-risk-medium" />
                    Governance Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {assessment.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-risk-medium mt-1">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {assessment.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Play className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assessment Yet</h3>
              <p className="text-muted-foreground mb-4">
                Run an AI governance check to evaluate risks and get recommendations.
              </p>
              <Button onClick={handleRunAssessment} disabled={runAssessment.isPending}>
                {runAssessment.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Governance Check
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
