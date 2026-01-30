import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAIFeature } from '@/hooks/useAIFeatures';
import { useLatestAssessment } from '@/hooks/useAssessments';
import { useReport, useGenerateReport } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Copy, Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: feature, isLoading: featureLoading } = useAIFeature(id || '');
  const { data: assessment, isLoading: assessmentLoading } = useLatestAssessment(id || '');
  const { data: report, isLoading: reportLoading } = useReport(id || '', assessment?.id);
  const generateReport = useGenerateReport();

  // Auto-generate report if it doesn't exist
  useEffect(() => {
    if (feature && assessment && !report && !reportLoading && !generateReport.isPending) {
      generateReport.mutate({ feature, assessment });
    }
  }, [feature, assessment, report, reportLoading]);

  const handleCopyToClipboard = async () => {
    if (report?.report_markdown) {
      await navigator.clipboard.writeText(report.report_markdown);
      toast.success('Copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (report?.report_markdown && feature) {
      const blob = new Blob([report.report_markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `governance-summary-${feature.name.toLowerCase().replace(/\s+/g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    }
  };

  if (featureLoading || assessmentLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!feature || !assessment) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Cannot Generate Report</h2>
          <p className="text-muted-foreground mb-4">
            Run an assessment first before generating a governance summary.
          </p>
          <Link to={id ? `/feature/${id}` : '/'}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feature
            </Button>
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
            <Link to={`/feature/${id}`}>
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Governance Summary</h1>
              <p className="text-muted-foreground">{feature.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleCopyToClipboard}
              disabled={!report}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={!report}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download .md
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="governance-section">
          {reportLoading || generateReport.isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating governance summary...</span>
            </div>
          ) : report ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownRenderer content={report.report_markdown} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to generate report. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Simple Markdown renderer
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-4 ml-6 list-disc space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-muted-foreground">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(2); // Skip header divider
      elements.push(
        <table key={`table-${elements.length}`} className="my-4 w-full border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border border-border px-4 py-2 text-left font-semibold bg-muted/50">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-border px-4 py-2">{cell}</td>
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

    // Table row
    if (line.startsWith('|')) {
      flushList();
      inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!line.includes('---')) {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Heading
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-8 mb-4 text-foreground first:mt-0">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl font-semibold mt-6 mb-3 text-foreground border-b border-border pb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
          {line.slice(4)}
        </h3>
      );
    }
    // Horizontal rule
    else if (line.startsWith('---')) {
      flushList();
      elements.push(<hr key={i} className="my-6 border-border" />);
    }
    // List item
    else if (line.startsWith('- ') || line.match(/^\d+\.\s/)) {
      inList = true;
      const itemText = line.replace(/^-\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(itemText);
    }
    // Bold line (like **text**)
    else if (line.startsWith('**') && line.endsWith('**')) {
      flushList();
      elements.push(
        <p key={i} className="my-2">
          <strong>{line.slice(2, -2)}</strong>
        </p>
      );
    }
    // Paragraph with bold inline
    else if (line.includes('**')) {
      flushList();
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <p key={i} className="my-2 text-muted-foreground">
          {parts.map((part, j) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      flushList();
      continue;
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={i} className="my-2 text-muted-foreground">{line}</p>
      );
    }
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}
