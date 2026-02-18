import { useMemo, type ComponentType } from "react";
import { Activity, ShieldAlert, ShieldCheck, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { AegisShell } from "@/components/layout/AegisShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { listActivity, listSystems } from "@/lib/aegis/storage";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";

const riskChartConfig = {
  count: { label: "Systems" },
  high: { label: "High", color: "#ef4444" },
  medium: { label: "Medium", color: "#f59e0b" },
  low: { label: "Low", color: "#10b981" },
};

const modelChartConfig = {
  count: { label: "Systems", color: "#60a5fa" },
};

const coverageChartConfig = {
  value: { label: "Coverage %", color: "#34d399" },
};

export default function Dashboard() {
  const systems = listSystems();
  const activity = listActivity(8);

  const metrics = useMemo(() => {
    const riskLevels = systems.map((system) => evaluateRiskTier(system.profile).level);
    const highRisk = riskLevels.filter((level) => level === "High").length;
    const mediumRisk = riskLevels.filter((level) => level === "Medium").length;
    const lowRisk = riskLevels.filter((level) => level === "Low").length;
    const implementedControls = systems.filter(
      (system) =>
        system.profile.has_robustness_testing &&
        system.profile.has_fairness_testing &&
        system.profile.has_safety_testing &&
        system.profile.has_model_card
    ).length;
    const maturityScore = systems.length
      ? Math.round((implementedControls / systems.length) * 100)
      : 0;

    const total = systems.length || 1;
    const riskData = [
      { name: "High", count: highRisk, fill: "#ef4444" },
      { name: "Medium", count: mediumRisk, fill: "#f59e0b" },
      { name: "Low", count: lowRisk, fill: "#10b981" },
    ];

    const modelTypeData = [
      {
        name: "ML",
        count: systems.filter((system) => system.profile.model_type === "ML").length,
      },
      {
        name: "LLM",
        count: systems.filter((system) => system.profile.model_type === "LLM").length,
      },
      {
        name: "LLM_RAG",
        count: systems.filter((system) => system.profile.model_type === "LLM_RAG").length,
      },
    ];

    const controlCoverageData = [
      {
        name: "Robustness",
        value: Math.round((systems.filter((system) => system.profile.has_robustness_testing).length / total) * 100),
      },
      {
        name: "Fairness",
        value: Math.round((systems.filter((system) => system.profile.has_fairness_testing).length / total) * 100),
      },
      {
        name: "Safety",
        value: Math.round((systems.filter((system) => system.profile.has_safety_testing).length / total) * 100),
      },
      {
        name: "Model Card",
        value: Math.round((systems.filter((system) => system.profile.has_model_card).length / total) * 100),
      },
    ];

    return {
      highRisk,
      mediumRisk,
      lowRisk,
      implementedControls,
      maturityScore,
      riskData,
      modelTypeData,
      controlCoverageData,
    };
  }, [systems]);

  return (
    <AegisShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aegis AI governance posture across your current systems.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Systems" value={systems.length} icon={ShieldCheck} />
          <MetricCard title="High Risk Count" value={metrics.highRisk} icon={ShieldAlert} />
          <MetricCard title="Controls Implemented" value={metrics.implementedControls} icon={Target} />
          <MetricCard title="Maturity Score" value={`${metrics.maturityScore}%`} icon={Activity} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={riskChartConfig} className="h-[240px] w-full">
                <PieChart>
                  <Pie
                    data={metrics.riskData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {metrics.riskData.map((entry) => (
                      <Cell key={`risk-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={modelChartConfig} className="h-[240px] w-full">
                <BarChart data={metrics.modelTypeData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Control Coverage (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={coverageChartConfig} className="h-[240px] w-full">
                <BarChart data={metrics.controlCoverageData} layout="vertical" margin={{ left: 16, right: 10, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={84} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={6} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-2">
                  <p className="text-sm font-medium">{item.system_name}</p>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AegisShell>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
