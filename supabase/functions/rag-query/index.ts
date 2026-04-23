// Edge function: query the RAG knowledge base.
// Vector mode: when OPENAI_API_KEY is set, embeds the query and uses cosine similarity.
// Lite mode: keyword-based ranking (ILIKE) — works with no OpenAI key.
// Then calls Lovable AI Gateway to compose a grounded answer with citations.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QueryRequest {
  query: string;
  scope?: "regulation" | "evidence" | "both";
  ai_feature_id?: string;
  top_k?: number;
  task?: "interview" | "control" | "evidence_check" | "report";
}

interface ChunkHit {
  chunk_id: string;
  document_id: string;
  content: string;
  title: string;
  standard_id: string | null;
  source_url: string | null;
  kind: string;
  score: number;
}

async function embedQuery(text: string, openaiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI embed failed: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

async function keywordSearch(
  supabase: ReturnType<typeof createClient>,
  query: string,
  scope: string,
  aiFeatureId: string | undefined,
  topK: number
): Promise<ChunkHit[]> {
  const tokens = tokenize(query).slice(0, 8);
  if (tokens.length === 0) return [];

  // Build OR ILIKE filter
  const orFilter = tokens.map((t) => `content.ilike.%${t}%`).join(",");

  let q = supabase
    .from("rag_chunks")
    .select(
      "id, content, document_id, rag_documents!inner(title, standard_id, source_url, kind, ai_feature_id)"
    )
    .or(orFilter)
    .limit(topK * 4);

  const { data, error } = await q;
  if (error) throw error;

  const hits: ChunkHit[] = (data ?? [])
    .filter((row: any) => {
      const doc = row.rag_documents;
      if (scope !== "both" && doc.kind !== scope) return false;
      if (aiFeatureId && doc.kind === "evidence" && doc.ai_feature_id !== aiFeatureId) return false;
      return true;
    })
    .map((row: any) => {
      const lc = row.content.toLowerCase();
      const score = tokens.reduce((s, t) => s + (lc.split(t).length - 1), 0);
      return {
        chunk_id: row.id,
        document_id: row.document_id,
        content: row.content,
        title: row.rag_documents.title,
        standard_id: row.rag_documents.standard_id,
        source_url: row.rag_documents.source_url,
        kind: row.rag_documents.kind,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return hits;
}

async function vectorSearch(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  scope: string,
  aiFeatureId: string | undefined,
  topK: number
): Promise<ChunkHit[]> {
  // Use raw SQL via rpc would need a function; instead we do a wide select + cosine in JS for now.
  // For production, replace with a SQL function. This works at small scale.
  const { data, error } = await supabase
    .from("rag_chunks")
    .select(
      "id, content, document_id, embedding, rag_documents!inner(title, standard_id, source_url, kind, ai_feature_id)"
    )
    .not("embedding", "is", null)
    .limit(500);

  if (error) throw error;

  const cosine = (a: number[], b: number[]): number => {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
  };

  return (data ?? [])
    .filter((row: any) => {
      const doc = row.rag_documents;
      if (scope !== "both" && doc.kind !== scope) return false;
      if (aiFeatureId && doc.kind === "evidence" && doc.ai_feature_id !== aiFeatureId) return false;
      return true;
    })
    .map((row: any) => {
      const emb = typeof row.embedding === "string" ? JSON.parse(row.embedding) : row.embedding;
      return {
        chunk_id: row.id,
        document_id: row.document_id,
        content: row.content,
        title: row.rag_documents.title,
        standard_id: row.rag_documents.standard_id,
        source_url: row.rag_documents.source_url,
        kind: row.rag_documents.kind,
        score: cosine(embedding, emb),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function buildSystemPrompt(task: string): string {
  const base =
    "You are an AI Governance Assistant grounded in international AI regulations and the user's own evidence. Always cite sources by [Title — Standard]. Be precise, audit-ready, and never fabricate clauses.";
  switch (task) {
    case "interview":
      return `${base} Use retrieved regulation context to ask sharper risk-identification follow-up questions or explain why a question matters.`;
    case "control":
      return `${base} Generate concrete, customized implementation steps for the requested control, anchored in the cited standards.`;
    case "evidence_check":
      return `${base} Compare the user's evidence against the regulation requirements and explain whether it satisfies them.`;
    case "report":
      return `${base} Produce concise, citation-rich report content for an executive audit summary.`;
    default:
      return base;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as QueryRequest;
    if (!body?.query) {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scope = body.scope ?? "both";
    const topK = body.top_k ?? 6;
    const task = body.task ?? "interview";
    const liteMode = !openaiKey;

    let hits: ChunkHit[] = [];
    if (!liteMode) {
      try {
        const emb = await embedQuery(body.query, openaiKey);
        hits = await vectorSearch(supabase, emb, scope, body.ai_feature_id, topK);
      } catch (e) {
        console.warn("Vector search failed, falling back to keyword:", e);
        hits = await keywordSearch(supabase, body.query, scope, body.ai_feature_id, topK);
      }
    } else {
      hits = await keywordSearch(supabase, body.query, scope, body.ai_feature_id, topK);
    }

    if (!lovableKey) {
      return new Response(
        JSON.stringify({
          mode: liteMode ? "lite" : "vector",
          answer: "",
          citations: hits,
          warning: "LOVABLE_API_KEY missing — context returned without AI synthesis.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextBlock = hits
      .map(
        (h, i) =>
          `[#${i + 1}] (${h.kind}${h.standard_id ? ` · ${h.standard_id}` : ""}) ${h.title}\n${h.content}`
      )
      .join("\n\n---\n\n");

    const userPrompt = `# CONTEXT\n${contextBlock || "(no matching context found)"}\n\n# USER QUERY\n${body.query}\n\nRespond grounded in the context. Cite as [#index].`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystemPrompt(task) },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const answer = aiJson.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({
        mode: liteMode ? "lite" : "vector",
        answer,
        citations: hits,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("rag-query error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});