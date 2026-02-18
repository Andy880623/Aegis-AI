import { useState } from "react";
import { Link } from "react-router-dom";
import { AegisShell } from "@/components/layout/AegisShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteSystem, listSystems } from "@/lib/aegis/storage";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";

export default function AISystems() {
  const [systems, setSystems] = useState(() => listSystems());

  const handleDelete = (id: string, systemName: string) => {
    const confirmed = window.confirm(`Delete "${systemName || "Untitled system"}"? This cannot be undone.`);
    if (!confirmed) return;

    const deleted = deleteSystem(id);
    if (!deleted) return;
    setSystems((prev) => prev.filter((system) => system.id !== id));
  };

  return (
    <AegisShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Repository</h1>
            <p className="text-sm text-muted-foreground mt-1">
              All systems captured by Aegis interview workflow.
            </p>
          </div>
          <Link to={`/workspace?new=${Date.now()}`}>
            <Button>New Assessment</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {systems.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No systems yet. Start from Assessment.
              </CardContent>
            </Card>
          ) : (
            systems.map((system) => {
              const risk = evaluateRiskTier(system.profile);
              return (
                <Card key={system.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{system.profile.system_name || "Untitled system"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Model: {system.profile.model_type}</p>
                    <p className="text-muted-foreground">Domain: {system.profile.domain}</p>
                    <p className="text-muted-foreground">Risk: {risk.level}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link to={`/systems/${system.id}`}>
                        <Button size="sm" variant="outline">Details</Button>
                      </Link>
                      <Link to={`/workspace?id=${system.id}`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(system.id, system.profile.system_name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AegisShell>
  );
}
