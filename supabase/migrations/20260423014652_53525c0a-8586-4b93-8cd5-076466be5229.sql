-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table: regulations + user-uploaded evidence
CREATE TABLE public.rag_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('regulation', 'evidence')),
  standard_id text,
  title text NOT NULL,
  region text,
  source_url text,
  ai_feature_id uuid,
  full_text text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chunks table: chunked text + optional embedding
CREATE TABLE public.rag_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.rag_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rag_documents_kind ON public.rag_documents(kind);
CREATE INDEX idx_rag_documents_standard ON public.rag_documents(standard_id);
CREATE INDEX idx_rag_documents_feature ON public.rag_documents(ai_feature_id);
CREATE INDEX idx_rag_chunks_document ON public.rag_chunks(document_id);

-- HNSW vector index (only used when embedding column is populated)
CREATE INDEX idx_rag_chunks_embedding ON public.rag_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Enable RLS with public access (matches existing project pattern)
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on rag_documents" ON public.rag_documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rag_documents" ON public.rag_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rag_documents" ON public.rag_documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on rag_documents" ON public.rag_documents FOR DELETE USING (true);

CREATE POLICY "Allow public read on rag_chunks" ON public.rag_chunks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rag_chunks" ON public.rag_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rag_chunks" ON public.rag_chunks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on rag_chunks" ON public.rag_chunks FOR DELETE USING (true);

-- Trigger for updated_at on documents
CREATE TRIGGER update_rag_documents_updated_at
  BEFORE UPDATE ON public.rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();