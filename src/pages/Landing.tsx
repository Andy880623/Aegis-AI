import { ArrowRight, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary">Aegis AI</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Modern SaaS + AI Assistant Hybrid UI for Governance
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Run guided interviews, compute risk tier, identify validation gaps, generate controls,
            and export governance-ready reports.
          </p>
          <div className="mt-8">
            <Link to="/workspace">
              <Button size="lg" className="gap-2">
                Start AI Governance Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <StepCard
            icon={ShieldCheck}
            title="1. Guided Interview"
            description="A structured copilot interview creates a consistent AI System Profile JSON."
          />
          <StepCard
            icon={ClipboardCheck}
            title="2. Deterministic Governance"
            description="Risk tiering, validation gaps, and prioritized controls update live."
          />
          <StepCard
            icon={FileText}
            title="3. Decision-Ready Reports"
            description="Generate Risk Summary, Model Card, and Governance Action Plan in Markdown."
          />
        </div>
      </div>
    </div>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="w-fit rounded-md bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
