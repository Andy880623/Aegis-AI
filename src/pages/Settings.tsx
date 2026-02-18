import { AegisShell } from "@/components/layout/AegisShell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOpenAIConfig, hasOpenAIConfigured } from "@/lib/aegis/chatgpt";

export default function SettingsPage() {
  const config = getOpenAIConfig();
  const connected = hasOpenAIConfigured();

  return (
    <AegisShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Appearance, profile, and ChatGPT connection.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Theme Mode</p>
              <ThemeToggle />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input placeholder="Aegis" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input placeholder="andrew@company.com" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ChatGPT Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aegis realtime interview uses real ChatGPT when `.env` is configured.
            </p>
            <p className="text-xs text-muted-foreground">
              Status: {connected ? "Connected" : "Not connected"}
            </p>
            <p className="text-xs text-muted-foreground">
              Configure in local `.env`: `VITE_OPENAI_API_KEY` and `VITE_OPENAI_MODEL`.
            </p>
            <p className="text-xs text-muted-foreground">
              Active model: {config.model}
            </p>
          </CardContent>
        </Card>
      </div>
    </AegisShell>
  );
}
