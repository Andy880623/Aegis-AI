import { useState } from "react";
import { Loader2, Upload, FileCode2, FileText, MessageSquareText, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  saveEvidence,
  listEvidence,
  deleteEvidence,
  type EvidenceRecord,
  type ComplianceVerdict,
  VERDICT_LABEL,
} from "@/lib/aegis/evidence";
import type { GeneratedControl } from "@/types/aegis";
import { clausesForCategory, formatCitation } from "@/lib/aegis/standards";

interface EvidenceUploaderProps {
  control: GeneratedControl;
  systemId: string | null;
  onChange?: () => void;
}

const verdictStyle: Record<ComplianceVerdict, string> = {
  PASS: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PARTIAL: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  FAIL: "bg-red-500/15 text-red-300 border-red-500/30",
  PENDING: "bg-muted text-muted-foreground border-border",
};

const verdictIcon: Record<ComplianceVerdict, React.ReactNode> = {
  PASS: <CheckCircle2 className="h-3.5 w-3.5" />,
  PARTIAL: <AlertTriangle className="h-3.5 w-3.5" />,
  FAIL: <XCircle className="h-3.5 w-3.5" />,
  PENDING: <span />,
};

async function readFileAsText(file: File): Promise<string> {
  if (file.type.startsWith("text/") || /\.(txt|md|json|csv|ya?ml|toml|log|xml|html?|js|ts|tsx|jsx|py|rb|go|rs|java|cs|cpp|c|sh|sql)$/i.test(file.name)) {
    return file.text();
  }
  // For binary docs (pdf/docx), stream as base64-truncated string. Backend treats it as raw text best-effort.
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Quick heuristic: try decoding as UTF-8 first
  try {
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    // strip non-printable chunks heavily for PDF/DOCX
    return decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]+/g, " ").slice(0, 80000);
  } catch {
    return `[Binary file ${file.name}, ${bytes.length} bytes — text extraction limited. Provide text excerpt for accurate review.]`;
  }
}

export function EvidenceUploader({ control, systemId, onChange }: EvidenceUploaderProps) {
  const [tab, setTab] = useState<"text" | "file" | "code">("text");
  const [textValue, setTextValue] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [codeLang, setCodeLang] = useState("python");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<EvidenceRecord[]>(() =>
    listEvidence(control.id, systemId)
  );

  const refresh = () => {
    setRecords(listEvidence(control.id, systemId));
    onChange?.();
  };

  const runScan = async () => {
    setError(null);
    let payload: { kind: "text" | "file" | "code"; content: string; filename?: string; language?: string };
    try {
      if (tab === "text") {
        if (!textValue.trim()) return setError("Please paste your evidence text.");
        payload = { kind: "text", content: textValue.trim() };
      } else if (tab === "code") {
        if (!codeValue.trim()) return setError("Paste a code snippet to evaluate.");
        payload = { kind: "code", content: codeValue.trim(), language: codeLang };
      } else {
        if (!fileObj) return setError("Choose a file to upload.");
        const content = await readFileAsText(fileObj);
        payload = { kind: "file", content, filename: fileObj.name };
      }

      setScanning(true);
      const citations = clausesForCategory(control.category).map(formatCitation);

      const { data, error: fnError } = await supabase.functions.invoke("evidence-scan", {
        body: {
          control: {
            id: control.id,
            title: control.title,
            objective: control.how_to_template.objective,
            steps: control.how_to_template.steps,
            evidence: control.how_to_template.evidence,
            citations,
          },
          evidence: payload,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) throw new Error(data?.error ?? "Scan failed");

      saveEvidence({
        control_id: control.id,
        system_id: systemId,
        kind: payload.kind,
        filename: payload.filename,
        language: payload.language,
        content: payload.content.slice(0, 4000),
        verdict: data.verdict as ComplianceVerdict,
        confidence: Number(data.confidence) || 0,
        rationale: String(data.rationale ?? ""),
        matched_requirements: Array.isArray(data.matched_requirements) ? data.matched_requirements : [],
        missing_requirements: Array.isArray(data.missing_requirements) ? data.missing_requirements : [],
        citations: Array.isArray(data.citations) ? data.citations : citations,
      });

      setTextValue("");
      setCodeValue("");
      setFileObj(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const removeRecord = (id: string) => {
    deleteEvidence(id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200/90">
        <strong className="text-cyan-300">AI verification required.</strong> Evidence is scored by an
        AI auditor; manual ticking does not satisfy this control. Submit a document, code excerpt,
        or written description.
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="text" className="gap-1.5"><MessageSquareText className="h-3.5 w-3.5" /> Text</TabsTrigger>
          <TabsTrigger value="file" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Document</TabsTrigger>
          <TabsTrigger value="code" className="gap-1.5"><FileCode2 className="h-3.5 w-3.5" /> Code</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-3">
          <Textarea
            placeholder="Describe the implementation, paste a policy excerpt, or summarise testing results..."
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            rows={6}
          />
        </TabsContent>

        <TabsContent value="file" className="mt-3 space-y-2">
          <input
            type="file"
            accept=".txt,.md,.pdf,.docx,.json,.csv,.html,.xml,.yaml,.yml,.log"
            onChange={(e) => setFileObj(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground hover:file:bg-primary/90"
          />
          {fileObj && (
            <p className="text-xs text-muted-foreground">
              {fileObj.name} · {(fileObj.size / 1024).toFixed(1)} KB
            </p>
          )}
        </TabsContent>

        <TabsContent value="code" className="mt-3 space-y-2">
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            {["python", "typescript", "javascript", "java", "go", "ruby", "sql", "yaml", "shell", "other"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <Textarea
            placeholder="Paste implementation code (auth checks, fairness eval, monitoring config, IaC etc.)"
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value)}
            rows={8}
            className="font-mono text-xs"
          />
        </TabsContent>
      </Tabs>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="button" onClick={runScan} disabled={scanning} className="gap-2">
        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {scanning ? "AI auditor reviewing..." : "Submit for AI verification"}
      </Button>

      {records.length > 0 && (
        <div className="space-y-2 pt-2">
          <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Verification history</h5>
          {records.map((rec) => (
            <div key={rec.id} className="rounded-md border border-border bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={`gap-1 ${verdictStyle[rec.verdict]}`}>
                  {verdictIcon[rec.verdict]}
                  {VERDICT_LABEL[rec.verdict]} · {Math.round(rec.confidence * 100)}%
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{rec.kind}{rec.filename ? ` · ${rec.filename}` : ""}</span>
                  <span>·</span>
                  <span>{new Date(rec.created_at).toLocaleString()}</span>
                  <button
                    onClick={() => removeRecord(rec.id)}
                    className="text-muted-foreground hover:text-red-400"
                    aria-label="Delete evidence"
                  >×</button>
                </div>
              </div>
              <p className="text-foreground/80">{rec.rationale}</p>
              {rec.matched_requirements.length > 0 && (
                <div>
                  <span className="text-emerald-300">Matched: </span>
                  <span className="text-muted-foreground">{rec.matched_requirements.join("; ")}</span>
                </div>
              )}
              {rec.missing_requirements.length > 0 && (
                <div>
                  <span className="text-amber-300">Gaps: </span>
                  <span className="text-muted-foreground">{rec.missing_requirements.join("; ")}</span>
                </div>
              )}
              {rec.citations.length > 0 && (
                <div className="pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Standards: </span>
                  <span className="text-foreground/70">{rec.citations.join(" · ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
