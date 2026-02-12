import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Shield,
  MessageSquare,
  Search,
  FileCheck,
  Users,
  Code,
  Scale,
  Rocket,
  ArrowRight,
} from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: 'We interview you about your AI system',
    description: 'Answer simple questions about your AI use case, data handling, and current practices.',
  },
  {
    icon: Search,
    title: 'We assess risk and validation gaps',
    description: 'Our engine classifies your AI risk tier and identifies testing and governance gaps.',
  },
  {
    icon: FileCheck,
    title: 'We generate controls, guidance, and reports',
    description: 'Get a prioritized checklist, implementation steps, and downloadable governance reports.',
  },
];

const audiences = [
  { icon: Users, label: 'AI product teams' },
  { icon: Code, label: 'ML engineers' },
  { icon: Scale, label: 'Compliance & risk teams' },
  { icon: Rocket, label: 'Startups without dedicated AI governance' },
];

export default function Landing() {
  return (
    <AppLayout fullWidth>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="aegis-container py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Shield className="h-3 w-3" />
            AI Governance Copilot
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
            Turn Your AI System Into a Governed, Auditable, and Safer System in{' '}
            <span className="text-primary">10 Minutes</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Aegis AI interviews your team, evaluates AI risks, and generates a practical
            internal control and validation plan — no legal background needed.
          </p>

          <div className="mt-8">
            <Link to="/interview">
              <Button size="lg" className="gap-2 text-base px-6 py-5">
                Start AI Governance Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="aegis-container">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">How It Works</h2>

          <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-primary mb-2">Step {i + 1}</div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built For */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
        <div className="aegis-container">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">Built For</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-3xl mx-auto">
            {audiences.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <a.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
