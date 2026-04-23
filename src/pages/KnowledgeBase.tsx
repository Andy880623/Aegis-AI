import { useEffect, useState } from "react";
import { AegisShell } from "@/components/layout/AegisShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Database, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { STANDARDS, type StandardId } from "@/lib/aegis/standards";
import {
  ragIngest,
  ragQuery,
  listRagDocuments,
  deleteRagDocument,
  type RagCitation,
} from "@/lib/aegis/rag-client";

interface DocRow {
  id: string;
  kind: string;
  title: string;
  standard_id: string | null;
  region: string | null;
  source_url: string | null;
  created_at: string;
}

const STANDARD_OPTIONS: { id: StandardId; label: string }[] = Object.values(STANDARDS).map(
  (s) => ({ id: s.id, label: `${s.short} — ${s.region}` })
);

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [standardId, setStandardId] = useState<StandardId | "">("");
  const [title, setTitle] = useState("");
  const [fullText, setFullText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [lastMode, setLastMode] = useState<"lite" | "vector" | null>(null);

  const [query, setQuery] = useState("");
  const [querying, setQuerying] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<RagCitation[]>([]);
  const [queryMode, setQueryMode] = useState<"lite" | "vector" | null>(null);

  async function refresh() {
    setLoadingList(true);
    try {
      setDocs((await listRagDocuments()) as DocRow[]);
    } catch (e) {
      toast.error("Failed to load documents");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleIngest() {
    if (!title.trim() || !fullText.trim() || !standardId) {
      toast.error("Title, standard, and text are required");
      return;
    }
    setIngesting(true);
    try {
      const std = STANDARDS[standardId];
      const res = await ragIngest({
        kind: "regulation",
        title: title.trim(),
        full_text: fullText.trim(),
        standard_id: standardId,
        region: std.region,
        source_url: sourceUrl.trim() || std.url,
      });
      setLastMode(res.mode);
      toast.success(`Ingested ${res.chunks} chunks (${res.mode} mode)`);
      setTitle("");
      setFullText("");
      setSourceUrl("");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setIngesting(false);
    }
  }

  async function handleQuery() {
    if (!query.trim()) return;
    setQuerying(true);
    setAnswer("");
    setCitations([]);
    try {
      const res = await ragQuery({ query: query.trim(), scope: "both", top_k: 6, task: "interview" });
      setAnswer(res.answer);
      setCitations(res.citations);
      setQueryMode(res.mode);
      if (res.warning) toast.warning(res.warning);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Query failed");
    } finally {
      setQuerying(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRagDocument(id);
      toast.success("Document deleted");
      refresh();
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <AegisShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Knowledge Base (RAG)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingest international AI regulations and query the knowledge base. The system
              auto-detects whether vector embeddings or keyword (Lite mode) search is available.
            </p>
          </div>
          {lastMode ? (
            <Badge variant={lastMode === "vector" ? "default" : "secondary"}>
              Last ingest: {lastMode} mode
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Ingest Regulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Standard</Label>
                <Select value={standardId} onValueChange={(v) => setStandardId(v as StandardId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select standard" />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Document Title</Label>
                <Input
                  placeholder="e.g. EU AI Act — Art. 9 Risk Management"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Source URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Full Text</Label>
                <Textarea
                  placeholder="Paste the regulation clause text here..."
                  rows={8}
                  value={fullText}
                  onChange={(e) => setFullText(e.target.value)}
                />
              </div>
              <Button onClick={handleIngest} disabled={ingesting} className="w-full">
                {ingesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Ingest Document
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Test Query
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="e.g. What controls are required for high-risk AI under the EU AI Act?"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button onClick={handleQuery} disabled={querying} className="w-full">
                {querying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Query Knowledge Base
              </Button>

              {queryMode ? (
                <Badge variant={queryMode === "vector" ? "default" : "secondary"}>
                  Mode: {queryMode}
                </Badge>
              ) : null}

              {answer ? (
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Answer</p>
                  <p className="text-sm whitespace-pre-wrap">{answer}</p>
                </div>
              ) : null}

              {citations.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Citations ({citations.length})
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {citations.map((c, i) => (
                      <div key={c.chunk_id} className="rounded border border-border p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            [#{i + 1}] {c.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {c.standard_id ?? c.kind}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-3">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Indexed Documents {loadingList ? "" : `(${docs.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : docs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No documents yet. Ingest your first regulation above.
              </p>
            ) : (
              <div className="space-y-2">
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between border border-border rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {d.kind}
                        </Badge>
                        {d.standard_id ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {d.standard_id}
                          </Badge>
                        ) : null}
                        <span className="text-sm font-medium truncate">{d.title}</span>
                      </div>
                      {d.region ? (
                        <p className="text-xs text-muted-foreground mt-1">{d.region}</p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(d.id)}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AegisShell>
  );
}