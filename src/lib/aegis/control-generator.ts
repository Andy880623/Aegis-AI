import { controlsKnowledgeBase } from "@/lib/aegis/controls-kb";
import type {
  ControlCategory,
  ControlEvalContext,
  ControlPriority,
  GeneratedControl,
} from "@/types/aegis";

const PRIORITY_ORDER: ControlPriority[] = ["High", "Recommended", "Optional"];

export interface GeneratedControlsResult {
  selected: GeneratedControl[];
  byPriority: Record<ControlPriority, GeneratedControl[]>;
  byCategory: Record<ControlCategory, GeneratedControl[]>;
}

export function generateControls(context: ControlEvalContext): GeneratedControlsResult {
  const selected = controlsKnowledgeBase
    .filter((control) => control.isApplicable(context))
    .map((control) => ({ ...control, priority: control.getPriority(context) }))
    .sort((a, b) => {
      const p1 = PRIORITY_ORDER.indexOf(a.priority);
      const p2 = PRIORITY_ORDER.indexOf(b.priority);
      if (p1 !== p2) return p1 - p2;
      return a.category.localeCompare(b.category);
    });

  const byPriority: Record<ControlPriority, GeneratedControl[]> = {
    High: [],
    Recommended: [],
    Optional: [],
  };

  const byCategory = selected.reduce<Record<ControlCategory, GeneratedControl[]>>(
    (acc, item) => {
      acc[item.category] = [...(acc[item.category] ?? []), item];
      byPriority[item.priority].push(item);
      return acc;
    },
    {
      "Governance/Accountability": [],
      Lifecycle: [],
      Robustness: [],
      Fairness: [],
      Safety: [],
      Explainability: [],
      Monitoring: [],
      "Human Oversight": [],
    }
  );

  return { selected, byPriority, byCategory };
}

