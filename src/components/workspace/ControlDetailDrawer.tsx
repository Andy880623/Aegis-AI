import { useEffect, useState } from "react";
import { WandSparkles, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { aiGuidanceEnabled, refineControlTemplateWithAI } from "@/lib/aegis/ai-refine";
import type { GeneratedControl } from "@/types/aegis";
import { EvidenceUploader } from "./EvidenceUploader";
import { clausesForCategory, getStandard } from "@/lib/aegis/standards";

interface ControlDetailDrawerProps {
  control: GeneratedControl | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId?: string | null;
}

export function ControlDetailDrawer({ control, open, onOpenChange, systemId = null }: ControlDetailDrawerProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [refined, setRefined] = useState(control?.how_to_template ?? null);

  useEffect(() => {
    setRefined(control?.how_to_template ?? null);
  }, [control]);

  const template = refined ?? control?.how_to_template ?? null;
  const clauses = control ? clausesForCategory(control.category) : [];

  const handleRefine = async () => {
    if (!control || !aiGuidanceEnabled) return;
    setIsRefining(true);
    const next = await refineControlTemplateWithAI(control.how_to_template);
    setRefined(next);
    setIsRefining(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {control && template ? (
          <>
            <SheetHeader>
              <SheetTitle>{control.title}</SheetTitle>
              <SheetDescription>
                {control.category} | Priority: {control.priority}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-5">
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                Guidance, not legal advice.
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!aiGuidanceEnabled || isRefining}
                        onClick={handleRefine}
                        className="gap-2"
                      >
                        <WandSparkles className="h-4 w-4" />
                        {isRefining ? "Refining..." : "Refine with AI Guidance"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!aiGuidanceEnabled ? <TooltipContent>Connect AI to enable.</TooltipContent> : null}
                </Tooltip>
              </div>

              <div>
                <h4 className="text-sm font-semibold">Objective</h4>
                <p className="mt-1 text-sm text-muted-foreground">{template.objective}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold">Steps</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {template.steps.map((step, index) => (
                    <li key={`${step}-${index}`}>{index + 1}. {step}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold">Suggested Tools</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {template.suggested_tools.map((tool) => (
                    <li key={tool}>- {tool}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold">Evidence</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {template.evidence.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>

              {clauses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <BookMarked className="h-3.5 w-3.5" />
                    Aligned standards
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs">
                    {clauses.map((c) => {
                      const std = getStandard(c.standard);
                      return (
                        <li key={`${c.standard}-${c.clause}`}>
                          <span className="text-foreground font-medium">{std.short}</span>
                          <span className="text-muted-foreground"> {c.clause} — {c.title}</span>
                          <a href={std.url} target="_blank" rel="noreferrer" className="ml-1 text-cyan-400 hover:underline">[source]</a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-semibold mb-3">AI Compliance Verification</h4>
                <EvidenceUploader control={control} systemId={systemId} />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
