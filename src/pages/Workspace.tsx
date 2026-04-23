import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AegisShell } from "@/components/layout/AegisShell";
import { InterviewAgentPanel } from "@/components/workspace/InterviewAgentPanel";
import {
  GovernanceOutputPanel,
  type QuestionnaireFieldStatus,
} from "@/components/workspace/GovernanceOutputPanel";
import { Button } from "@/components/ui/button";
import { defaultSystemProfile } from "@/lib/aegis/schema";
import { getSystemById, listSystems } from "@/lib/aegis/storage";
import type { AI_System_Profile } from "@/types/aegis";

type FieldStatuses = Partial<Record<keyof AI_System_Profile, QuestionnaireFieldStatus>>;
type UpdateSource = "autofill" | "manual";

const profileKeys = Object.keys(defaultSystemProfile) as Array<keyof AI_System_Profile>;

function isValueFilled(value: AI_System_Profile[keyof AI_System_Profile]) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isSameValue(a: AI_System_Profile[keyof AI_System_Profile], b: AI_System_Profile[keyof AI_System_Profile]) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
  }
  return a === b;
}

function getChangedKeys(prev: AI_System_Profile, next: AI_System_Profile) {
  return profileKeys.filter((key) => !isSameValue(prev[key], next[key]));
}

function deriveInitialStatuses(profile: AI_System_Profile): FieldStatuses {
  const statuses: FieldStatuses = {};
  for (const key of profileKeys) {
    statuses[key] = isValueFilled(profile[key]) ? "Confirmed" : "Missing";
  }
  return statuses;
}

function applyStatusUpdate(
  current: FieldStatuses,
  prevProfile: AI_System_Profile,
  nextProfile: AI_System_Profile,
  source: UpdateSource,
) {
  const changed = getChangedKeys(prevProfile, nextProfile);
  if (!changed.length) return current;

  const nextStatuses: FieldStatuses = { ...current };
  for (const key of changed) {
    const currentStatus = current[key];
    const filled = isValueFilled(nextProfile[key]);

    if (!filled) {
      nextStatuses[key] = "Missing";
      continue;
    }

    if (source === "manual") {
      nextStatuses[key] = "Confirmed";
      continue;
    }

    nextStatuses[key] = currentStatus === "Confirmed" ? "Confirmed" : "Auto-filled";
  }

  return nextStatuses;
}

export default function Workspace() {
  const location = useLocation();
  const initial = useMemo(() => {
    const latest = listSystems()[0];
    return latest ? { id: latest.id, profile: latest.profile } : { id: null, profile: defaultSystemProfile };
  }, []);

  const [profile, setProfile] = useState<AI_System_Profile>(initial.profile);
  const [systemId, setSystemId] = useState<string | null>(initial.id);
  const [fieldStatuses, setFieldStatuses] = useState<FieldStatuses>(() => deriveInitialStatuses(initial.profile));
  const [interviewInstanceKey, setInterviewInstanceKey] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const shouldStartNew = query.has("new");
    if (shouldStartNew) {
      setSystemId(null);
      setProfile(defaultSystemProfile);
      setFieldStatuses(deriveInitialStatuses(defaultSystemProfile));
      setInterviewInstanceKey((value) => value + 1);
      return;
    }

    const targetId = query.get("id");
    if (!targetId) return;

    const record = getSystemById(targetId);
    if (!record) return;

    setSystemId(record.id);
    setProfile(record.profile);
    setFieldStatuses(deriveInitialStatuses(record.profile));
    setInterviewInstanceKey((value) => value + 1);
  }, [location.search]);

  const handleAutoFilledProfileChange = (next: AI_System_Profile) => {
    setProfile((prev) => {
      setFieldStatuses((current) => applyStatusUpdate(current, prev, next, "autofill"));
      return next;
    });
  };

  const handleManualQuestionnaireChange = (next: AI_System_Profile) => {
    setProfile((prev) => {
      setFieldStatuses((current) => applyStatusUpdate(current, prev, next, "manual"));
      return next;
    });
  };

  const handleConfirmField = (key: keyof AI_System_Profile) => {
    setFieldStatuses((current) => ({ ...current, [key]: "Confirmed" }));
  };

  const restoreSavedSystem = (id: string) => {
    setSystemId(id);
    const record = getSystemById(id);
    if (!record) return;

    setProfile(record.profile);
    setFieldStatuses(deriveInitialStatuses(record.profile));
  };

  return (
    <AegisShell>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Inherent Risk Assessment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hold the microphone on the left to start a voice interview with Aegis (Taiwanese male voice). The questionnaire on the right auto-fills in real time and remains manually editable. The Residual Risk Assessment will be generated automatically once Controls are completed.
            </p>
          </div>
          <Link to={`/workspace?new=${Date.now()}`}>
            <Button>New Assessment</Button>
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[44%_56%]">
          <InterviewAgentPanel
            key={interviewInstanceKey}
            profile={profile}
            systemId={systemId}
            onProfileChange={handleAutoFilledProfileChange}
            onPersist={restoreSavedSystem}
            onComplete={handleAutoFilledProfileChange}
          />
          <GovernanceOutputPanel
            profile={profile}
            onChange={handleManualQuestionnaireChange}
            fieldStatuses={fieldStatuses}
            onConfirmField={handleConfirmField}
          />
        </div>
      </div>
    </AegisShell>
  );
}
