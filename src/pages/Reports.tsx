import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAIFeature } from '@/hooks/useAIFeatures';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Copy, Download, AlertTriangle, FileText, CreditCard, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { runGovernanceAnalysis, generateRiskSummaryReport, generateModelCardReport, generateActionPlanReport } from '@/lib/assessment';
import type { InterviewData } from '@/types/governance';
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

const reportTabs = [
  { id: 'risk', label: 'Risk Summary', icon: AlertTriangle },
  { id: 'model-card', label: 'Model Card', icon: CreditCard },
  { id: 'action-plan', label: 'Action Plan', icon: ListChecks },
] as const;

export default function Reports() {
  const { id } = useParams<{ id: string }>();
  const { data: feature, isLoading } = useAIFeature(id || '');

  const reports = useMemo(() => {
    if (!feature) return null;
    const interview = featureToInterview(feature);
    const result = runGovernanceAnalysis(interview);
    return {
      risk: generateRiskSummaryReport(interview, result),
      'model-card': generateModelCardReport(interview, result),
      'action-plan': generateActionPlanReport(interview, result),
    };
  }, [feature]);

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!feature || !reports) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Reports Available</h2>
          <Link to="/interview">
            <Button>Start Interview</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const slug = feature.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/results/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Governance Reports</h1>
            <p className="text-muted-foreground">{feature.name}</p>
          </div>
        </div>

        <Tabs defaultValue="risk">
          <TabsList className="grid w-full grid-cols-3">
            {reportTabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 text-xs sm:text-sm">
                <tab.icon className="h-4 w-4 hidden sm:block" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{tab.label}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(reports[tab.id])} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={() => handleDownload(reports[tab.id], `${slug}-${tab.id}.md`)} className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                    <MarkdownRenderer content={reports[tab.id]} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inList = false;
  let listItems: { text: string; ordered: boolean }[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      const isOrdered = listItems[0].ordered;
      const List = isOrdered ? 'ol' : 'ul';
      elements.push(
        <List key={`list-${elements.length}`} className={`my-3 ml-5 space-y-1 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-muted-foreground">{renderInline(item.text)}</li>
          ))}
        </List>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(1);
      elements.push(
        <table key={`table-${elements.length}`} className="my-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border border-border px-3 py-2 text-left font-semibold bg-muted/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-border px-3 py-2 text-muted-foreground">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('|')) {
      flushList();
      inTable = true;
      if (line.includes('---')) continue;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-foreground first:mt-0">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={i} className="text-xl font-semibold mt-5 mb-2 text-foreground border-b border-border pb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(4)}</h3>);
    } else if (line.startsWith('#### ')) {
      flushList();
      elements.push(<h4 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(5)}</h4>);
    } else if (line.startsWith('---')) {
      flushList();
      elements.push(<hr key={i} className="my-5 border-border" />);
    } else if (line.startsWith('- ')) {
      inList = true;
      listItems.push({ text: line.slice(2), ordered: false });
    } else if (line.match(/^\d+\.\s/)) {
      inList = true;
      listItems.push({ text: line.replace(/^\d+\.\s/, ''), ordered: true });
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={i} className="my-2 text-muted-foreground">{renderInline(line)}</p>);
    }
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>
      : part
  );
}
