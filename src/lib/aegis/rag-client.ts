import { supabase } from "@/integrations/supabase/client";

export interface RagCitation {
  chunk_id: string;
  document_id: string;
  content: string;
  title: string;
  standard_id: string | null;
  source_url: string | null;
  kind: string;
  score: number;
}

export interface RagQueryResponse {
  mode: "lite" | "vector";
  answer: string;
  citations: RagCitation[];
  warning?: string;
}

export interface RagIngestPayload {
  kind: "regulation" | "evidence";
  title: string;
  full_text: string;
  standard_id?: string;
  region?: string;
  source_url?: string;
  ai_feature_id?: string;
  metadata?: Record<string, unknown>;
}

export interface RagIngestResponse {
  document_id: string;
  chunks: number;
  mode: "lite" | "vector";
}

export async function ragIngest(payload: RagIngestPayload): Promise<RagIngestResponse> {
  const { data, error } = await supabase.functions.invoke("rag-ingest", { body: payload });
  if (error) throw error;
  return data as RagIngestResponse;
}

export async function ragQuery(params: {
  query: string;
  scope?: "regulation" | "evidence" | "both";
  ai_feature_id?: string;
  top_k?: number;
  task?: "interview" | "control" | "evidence_check" | "report";
}): Promise<RagQueryResponse> {
  const { data, error } = await supabase.functions.invoke("rag-query", { body: params });
  if (error) throw error;
  return data as RagQueryResponse;
}

export async function listRagDocuments() {
  const { data, error } = await supabase
    .from("rag_documents")
    .select("id, kind, title, standard_id, region, source_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteRagDocument(id: string) {
  const { error } = await supabase.from("rag_documents").delete().eq("id", id);
  if (error) throw error;
}