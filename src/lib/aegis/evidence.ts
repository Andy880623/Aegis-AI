export type ComplianceVerdict = "PASS" | "PARTIAL" | "FAIL" | "PENDING";

export type EvidenceKind = "text" | "file" | "code";

export interface EvidenceRecord {
  id: string;
  control_id: string;
  system_id: string | null;
  kind: EvidenceKind;
  filename?: string;
  language?: string;       // for code evidence (e.g. python, ts)
  content: string;         // text body / extracted text / code
  verdict: ComplianceVerdict;
  confidence: number;      // 0-1
  rationale: string;       // AI explanation
  matched_requirements: string[];
  missing_requirements: string[];
  citations: string[];     // e.g. "EU AI Act Art. 14"
  created_at: string;
}

const STORAGE_KEY = "aegis_evidence_v1";

function readAll(): EvidenceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvidenceRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: EvidenceRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function listEvidence(controlId: string, systemId: string | null): EvidenceRecord[] {
  return readAll()
    .filter((row) => row.control_id === controlId && row.system_id === systemId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function listEvidenceForSystem(systemId: string | null): EvidenceRecord[] {
  return readAll().filter((row) => row.system_id === systemId);
}

export function saveEvidence(record: Omit<EvidenceRecord, "id" | "created_at">): EvidenceRecord {
  const full: EvidenceRecord = {
    ...record,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const next = [...readAll(), full];
  writeAll(next);
  return full;
}

export function deleteEvidence(id: string) {
  writeAll(readAll().filter((row) => row.id !== id));
}

export function latestVerdictForControl(
  controlId: string,
  systemId: string | null
): ComplianceVerdict {
  const rows = listEvidence(controlId, systemId);
  return rows[0]?.verdict ?? "PENDING";
}

export function complianceSummary(systemId: string | null) {
  const rows = listEvidenceForSystem(systemId);
  const byControl = new Map<string, EvidenceRecord>();
  for (const r of rows) {
    const existing = byControl.get(r.control_id);
    if (!existing || existing.created_at < r.created_at) {
      byControl.set(r.control_id, r);
    }
  }
  let pass = 0, partial = 0, fail = 0;
  for (const r of byControl.values()) {
    if (r.verdict === "PASS") pass++;
    else if (r.verdict === "PARTIAL") partial++;
    else if (r.verdict === "FAIL") fail++;
  }
  return { pass, partial, fail, total: byControl.size };
}

export const VERDICT_LABEL: Record<ComplianceVerdict, string> = {
  PASS: "Verified",
  PARTIAL: "Partial",
  FAIL: "Insufficient",
  PENDING: "No evidence",
};
