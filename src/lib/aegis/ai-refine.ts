import type { ControlTemplate } from "@/types/aegis";

export const aiGuidanceEnabled = import.meta.env.VITE_AI_GUIDANCE_ENABLED === "true";

export async function refineControlTemplateWithAI(template: ControlTemplate): Promise<ControlTemplate> {
  // Placeholder for future provider integration.
  // Keep deterministic template-first behavior for MVP.
  return template;
}

