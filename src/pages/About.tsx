import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Target, AlertTriangle, FileText } from 'lucide-react';

export default function About() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">About AI Governance Copilot</h1>
          <p className="text-lg text-muted-foreground">
            A structured approach to responsible AI development
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Purpose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                AI Governance Copilot helps product teams register, assess, and document AI features 
                with a focus on responsible AI principles. It provides a structured framework for 
                evaluating privacy, safety, fairness, transparency, and accountability risks.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Assessment Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The governance assessment evaluates AI features across five key dimensions:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Privacy:</span>
                  <span className="text-muted-foreground">
                    Data collection, processing, and sharing practices
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Safety & Misuse:</span>
                  <span className="text-muted-foreground">
                    Potential for harm and abuse prevention measures
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Fairness:</span>
                  <span className="text-muted-foreground">
                    Bias risks and equitable treatment of users
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Transparency:</span>
                  <span className="text-muted-foreground">
                    Explainability and user understanding
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Accountability:</span>
                  <span className="text-muted-foreground">
                    Human oversight and audit capabilities
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Risk Tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-risk-low-bg text-risk-low border border-risk-low-border font-medium">
                    Low
                  </span>
                  <span className="text-muted-foreground">
                    Minimal risk, basic safeguards sufficient
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-risk-medium-bg text-risk-medium border border-risk-medium-border font-medium">
                    Medium
                  </span>
                  <span className="text-muted-foreground">
                    Moderate risk, enhanced controls recommended
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-risk-high-bg text-risk-high border border-risk-high-border font-medium">
                    High
                  </span>
                  <span className="text-muted-foreground">
                    Significant risk, comprehensive review required
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 ml-6 list-decimal">
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Register</span> your AI feature with 
                  system details and data practices
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Assess</span> the feature using the 
                  governance check to identify risks
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Address</span> identified gaps and 
                  implement recommended safeguards
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Document</span> your governance 
                  posture with a generated summary report
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Designed for private client deployment; store data locally within the client environment.
        </p>
      </div>
    </AppLayout>
  );
}
