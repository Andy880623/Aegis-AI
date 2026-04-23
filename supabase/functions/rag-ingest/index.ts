// Edge function: ingest a document into the RAG knowledge base.
// Chunks text, optionally generates embeddings via OpenAI (if OPENAI_API_KEY is set),
// and stores them in rag_documents + rag_chunks. Falls back to keyword-only "Lite mode"
// when no OpenAI key is configured (embedding column left null).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IngestRequest {
  kind: "regulation" | "evidence";
  title: string;
  full_text: string;
  standard_id?: string;
  region?: string;
  source_url?: string;
  ai_feature_id?: string;
  metadata?: Record<string, unknown>;
}

const CHUNK_SIZE = 1200; // chars
const CHUNK_OVERLAP = 150;

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= CHUNK_SIZE) return [clean];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedBatch(texts: string[], openaiKey: string): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI embeddings failed (${res.status}): ${t}`);
  }
  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    const liteMode = !openaiKey;

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = (await req.json()) as IngestRequest;

    if (!body?.title || !body?.full_text || !body?.kind) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: kind, title, full_text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert document
    const { data: doc, error: docErr } = await supabase
      .from("rag_documents")
      .insert({
        kind: body.kind,
        title: body.title,
        standard_id: body.standard_id ?? null,
        region: body.region ?? null,
        source_url: body.source_url ?? null,
        ai_feature_id: body.ai_feature_id ?? null,
        full_text: body.full_text,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (docErr) throw docErr;

    // Chunk text
    const chunks = chunkText(body.full_text);

    // Embeddings (batched) or null in Lite mode
    let embeddings: (number[] | null)[] = chunks.map(() => null);
    if (!liteMode) {
      try {
        const BATCH = 64;
        const out: number[][] = [];
        for (let i = 0; i < chunks.length; i += BATCH) {
          const slice = chunks.slice(i, i + BATCH);
          const emb = await embedBatch(slice, openaiKey);
          out.push(...emb);
        }
        embeddings = out;
      } catch (e) {
        console.warn("Embedding failed, falling back to Lite mode:", e);
        embeddings = chunks.map(() => null);
      }
    }

    const rows = chunks.map((content, idx) => ({
      document_id: doc.id,
      chunk_index: idx,
      content,
      embedding: embeddings[idx],
      tokens: Math.ceil(content.length / 4),
    }));

    const { error: chunkErr } = await supabase.from("rag_chunks").insert(rows);
    if (chunkErr) throw chunkErr;

    return new Response(
      JSON.stringify({
        document_id: doc.id,
        chunks: rows.length,
        mode: liteMode ? "lite" : "vector",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("rag-ingest error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});