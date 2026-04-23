import type { AegisActivityRecord, AegisSystemRecord, AI_System_Profile } from "@/types/aegis";

const SYSTEMS_KEY = "aegis:systems";
const ACTIVITY_KEY = "aegis:activity";
const CONTROL_PROGRESS_KEY = "aegis:control-progress";
const CONTROL_STATUS_KEY = "aegis:control-status";
const CONTROL_EVIDENCE_KEY = "aegis:control-evidence";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listSystems(): AegisSystemRecord[] {
  return readJson<AegisSystemRecord[]>(SYSTEMS_KEY, []).sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at)
  );
}

export function getSystemById(id: string): AegisSystemRecord | null {
  return listSystems().find((system) => system.id === id) ?? null;
}

export function createSystem(profile: AI_System_Profile): AegisSystemRecord {
  const now = new Date().toISOString();
  const systems = listSystems();
  const record: AegisSystemRecord = {
    id: createId("sys"),
    created_at: now,
    updated_at: now,
    profile,
  };

  writeJson(SYSTEMS_KEY, [record, ...systems]);
  addActivity("created", record.id, profile.system_name, "Created new AI system profile");
  return record;
}

export function updateSystem(id: string, profile: AI_System_Profile): AegisSystemRecord | null {
  const systems = listSystems();
  const target = systems.find((system) => system.id === id);
  if (!target) return null;

  const updated: AegisSystemRecord = {
    ...target,
    profile,
    updated_at: new Date().toISOString(),
  };

  const next = systems.map((system) => (system.id === id ? updated : system));
  writeJson(SYSTEMS_KEY, next);
  addActivity("updated", id, profile.system_name, "Updated AI system profile");
  return updated;
}

export function upsertSystem(id: string | null, profile: AI_System_Profile): AegisSystemRecord {
  if (!id) return createSystem(profile);
  return updateSystem(id, profile) ?? createSystem(profile);
}

export function deleteSystem(id: string): boolean {
  const systems = listSystems();
  const exists = systems.some((system) => system.id === id);
  if (!exists) return false;

  const nextSystems = systems.filter((system) => system.id !== id);
  writeJson(SYSTEMS_KEY, nextSystems);

  const progressMap = readJson<Record<string, string[]>>(CONTROL_PROGRESS_KEY, {});
  if (progressMap[id]) {
    delete progressMap[id];
    writeJson(CONTROL_PROGRESS_KEY, progressMap);
  }

  return true;
}

export function listActivity(limit = 20): AegisActivityRecord[] {
  return readJson<AegisActivityRecord[]>(ACTIVITY_KEY, []).slice(0, limit);
}

export function addActivity(
  type: AegisActivityRecord["type"],
  systemId: string,
  systemName: string,
  details: string
) {
  const records = listActivity(200);
  const next: AegisActivityRecord = {
    id: createId("act"),
    type,
    system_id: systemId,
    system_name: systemName,
    details,
    created_at: new Date().toISOString(),
  };
  writeJson(ACTIVITY_KEY, [next, ...records]);
}

type ControlProgress = Record<string, string[]>;

export function getCompletedControls(systemId: string): string[] {
  const map = readJson<ControlProgress>(CONTROL_PROGRESS_KEY, {});
  return map[systemId] ?? [];
}

export function isControlCompleted(systemId: string, controlId: string): boolean {
  return getCompletedControls(systemId).includes(controlId);
}

export function setControlCompleted(systemId: string, controlId: string, completed: boolean) {
  const map = readJson<ControlProgress>(CONTROL_PROGRESS_KEY, {});
  const current = new Set(map[systemId] ?? []);

  if (completed) {
    current.add(controlId);
  } else {
    current.delete(controlId);
  }

  map[systemId] = Array.from(current);
  writeJson(CONTROL_PROGRESS_KEY, map);

  // Mirror to status map for backward compat with new residual engine
  const statusMap = readJson<ControlStatusMap>(CONTROL_STATUS_KEY, {});
  const systemStatus = { ...(statusMap[systemId] ?? {}) };
  systemStatus[controlId] = completed ? "completed" : "not_started";
  statusMap[systemId] = systemStatus;
  writeJson(CONTROL_STATUS_KEY, statusMap);
}

export type ControlStatus = "not_started" | "in_progress" | "completed";
type ControlStatusMap = Record<string, Record<string, ControlStatus>>;

export function getControlStatuses(systemId: string): Record<string, ControlStatus> {
  const statusMap = readJson<ControlStatusMap>(CONTROL_STATUS_KEY, {});
  const fromStatus = statusMap[systemId] ?? {};

  // Backfill from legacy completed list
  const legacy = getCompletedControls(systemId);
  const merged: Record<string, ControlStatus> = { ...fromStatus };
  for (const id of legacy) {
    if (!merged[id]) merged[id] = "completed";
  }
  return merged;
}

export function setControlStatus(systemId: string, controlId: string, status: ControlStatus) {
  const statusMap = readJson<ControlStatusMap>(CONTROL_STATUS_KEY, {});
  const systemStatus = { ...(statusMap[systemId] ?? {}) };
  systemStatus[controlId] = status;
  statusMap[systemId] = systemStatus;
  writeJson(CONTROL_STATUS_KEY, statusMap);

  // Keep the legacy completed list in sync for existing UI
  const progressMap = readJson<ControlProgress>(CONTROL_PROGRESS_KEY, {});
  const current = new Set(progressMap[systemId] ?? []);
  if (status === "completed") current.add(controlId);
  else current.delete(controlId);
  progressMap[systemId] = Array.from(current);
  writeJson(CONTROL_PROGRESS_KEY, progressMap);
}

export interface ControlEvidenceFile {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
}

type ControlEvidenceMap = Record<string, Record<string, ControlEvidenceFile[]>>;

export function getControlEvidence(systemId: string, controlId: string): ControlEvidenceFile[] {
  const map = readJson<ControlEvidenceMap>(CONTROL_EVIDENCE_KEY, {});
  return map[systemId]?.[controlId] ?? [];
}

export function getAllControlEvidence(systemId: string): Record<string, ControlEvidenceFile[]> {
  const map = readJson<ControlEvidenceMap>(CONTROL_EVIDENCE_KEY, {});
  return map[systemId] ?? {};
}

export function addControlEvidence(
  systemId: string,
  controlId: string,
  file: Omit<ControlEvidenceFile, "id" | "uploaded_at">,
): ControlEvidenceFile {
  const map = readJson<ControlEvidenceMap>(CONTROL_EVIDENCE_KEY, {});
  const systemMap = { ...(map[systemId] ?? {}) };
  const list = [...(systemMap[controlId] ?? [])];
  const entry: ControlEvidenceFile = {
    id: createId("ev"),
    uploaded_at: new Date().toISOString(),
    ...file,
  };
  list.push(entry);
  systemMap[controlId] = list;
  map[systemId] = systemMap;
  writeJson(CONTROL_EVIDENCE_KEY, map);
  return entry;
}

export function removeControlEvidence(systemId: string, controlId: string, evidenceId: string) {
  const map = readJson<ControlEvidenceMap>(CONTROL_EVIDENCE_KEY, {});
  const systemMap = { ...(map[systemId] ?? {}) };
  const list = (systemMap[controlId] ?? []).filter((entry) => entry.id !== evidenceId);
  systemMap[controlId] = list;
  map[systemId] = systemMap;
  writeJson(CONTROL_EVIDENCE_KEY, map);
}
