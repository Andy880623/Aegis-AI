import { Link, useParams } from "react-router-dom";
import { AegisShell } from "@/components/layout/AegisShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateControls } from "@/lib/aegis/control-generator";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { getSystemById } from "@/lib/aegis/storage";
import { evaluateValidationGaps } from "@/lib/aegis/validation-gaps";

export default function AISystemDetail() {
  const { id = "" } = useParams();
  const system = getSystemById(id);

  if (!system) {
    return (
      <AegisShell>
        <p className="text-sm text-muted-foreground">System not found.</p>
      </AegisShell>
    );
  }

  const risk = evaluateRiskTier(system.profile);
  const gaps = evaluateValidationGaps(system.profile, risk);
  const controls = generateControls({ profile: system.profile, risk, gaps });

  return (
    <AegisShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{system.profile.system_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Risk: {risk.level}</p>
          </div>
          <Link to={`/workspace?id=${system.id}`}>
            <Button variant="outline">Continue Interview</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(system.profile, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {controls.selected.slice(0, 12).map((control) => (
              <div key={control.id} className="rounded-md border border-border p-2 text-sm">
                {control.id} | {control.priority} | {control.title}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AegisShell>
  );
}
