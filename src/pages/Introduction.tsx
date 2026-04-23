import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bot,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Database,
  Workflow,
  Zap,
  Lightbulb,
  Target,
  Users,
} from "lucide-react";
import { AegisShell } from "@/components/layout/AegisShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const workflowSteps = [
  {
    num: "01",
    icon: LayoutDashboard,
    title: "Dashboard 總覽",
    route: "/dashboard",
    color: "from-sky-500/20 to-sky-500/5",
    iconColor: "text-sky-400",
    desc: "查看所有 AI 系統的治理狀態、風險分布與待處理項目",
    actions: ["檢視風險統計", "追蹤進度", "快速導航"],
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Repository 系統登錄",
    route: "/systems",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    desc: "建立 AI 系統清單，登錄基本資訊（用途、模型來源、資料類型等）",
    actions: ["新增 AI 系統", "管理系統元資料", "分類與搜尋"],
  },
  {
    num: "03",
    icon: Bot,
    title: "Inherent Risk 風險評估",
    route: "/workspace",
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
    desc: "透過 AI 引導訪談，自動計算固有風險等級（Low / Medium / High）",
    actions: ["AI 訪談 Agent", "風險引擎自動計算", "識別驗證缺口"],
  },
  {
    num: "04",
    icon: ClipboardList,
    title: "Controls 控制措施",
    route: "/controls",
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    desc: "依風險等級自動推薦控制清單，上傳證據文件並追蹤實作狀態",
    actions: ["套用建議控制", "上傳證據", "標記完成度"],
  },
  {
    num: "05",
    icon: ShieldAlert,
    title: "Residual Risk 殘餘風險",
    route: "/residual",
    color: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
    desc: "依控制完成度與證據權重，動態計算控制後剩餘風險",
    actions: ["即時風險重算", "證據權重評分", "缺口分析"],
  },
  {
    num: "06",
    icon: FileText,
    title: "Reports 治理報告",
    route: "/reports",
    color: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    desc: "一鍵產出 PDF / DOCX / XLSX 三種格式的稽核就緒報告",
    actions: ["NIST AI RMF", "ISO 42001", "EU AI Act"],
  },
];

const features = [
  {
    icon: Database,
    title: "Knowledge Base（RAG）",
    desc: "內建法規知識庫，AI 引用法規條文回答問題（NIST、ISO、EU AI Act 等）",
  },
  {
    icon: Sparkles,
    title: "AI 引導式訪談",
    desc: "對話式介面取代繁瑣表單，自動萃取結構化資料",
  },
  {
    icon: Target,
    title: "確定性風險引擎",
    desc: "規則式評分，可解釋、可重現，非 AI 黑盒判斷",
  },
  {
    icon: CheckCircle2,
    title: "證據驅動殘餘風險",
    desc: "已完成 + 有證據 = 100%、無證據 = 50%、進行中 = 25%",
  },
];

export default function Introduction() {
  return (
    <AegisShell>
      <div className="mx-auto max-w-6xl space-y-12 pb-12">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface to-accent-violet/10 p-8 lg:p-12">
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-accent-violet/20 blur-3xl" />
          <div className="relative">
            <Badge variant="outline" className="mb-4 border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              Platform Introduction
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Aegis AI 平台使用指南
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground lg:text-lg">
              從 AI 系統登錄到稽核就緒報告，6 步驟完成完整治理流程。
              融合 AI 訪談、確定性風險引擎、RAG 法規檢索，10 分鐘建立 NIST AI RMF / ISO 42001 對齊的治理證據鏈。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent-violet">
                  開始使用
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/workspace">
                <Button size="lg" variant="outline" className="gap-2">
                  <Bot className="h-4 w-4" />
                  直接進入訪談
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* WORKFLOW DIAGRAM */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Workflow</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">完整治理流程</h2>
              <p className="mt-1 text-sm text-muted-foreground">從系統登錄到報告產出的端到端 pipeline</p>
            </div>
          </div>

          {/* Visual flow diagram */}
          <Card className="overflow-hidden border-border bg-surface">
            <CardContent className="p-6 lg:p-8">
              {/* Desktop: horizontal flow */}
              <div className="hidden lg:block">
                <div className="relative">
                  <svg
                    className="absolute left-0 top-12 h-1 w-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 1"
                  >
                    <line
                      x1="6"
                      y1="0.5"
                      x2="94"
                      y2="0.5"
                      stroke="hsl(var(--primary) / 0.3)"
                      strokeWidth="0.3"
                      strokeDasharray="1 1"
                    />
                  </svg>
                  <div className="relative grid grid-cols-6 gap-2">
                    {workflowSteps.map((step) => (
                      <Link
                        to={step.route}
                        key={step.num}
                        className="group flex flex-col items-center text-center"
                      >
                        <div
                          className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-gradient-to-br ${step.color} transition-all group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg`}
                        >
                          <step.icon className={`h-9 w-9 ${step.iconColor}`} />
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background font-mono text-[10px] font-semibold text-foreground">
                            {step.num}
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-foreground">{step.title.split(" ")[0]}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                          {step.title.split(" ").slice(1).join(" ")}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile/tablet: vertical flow */}
              <div className="space-y-3 lg:hidden">
                {workflowSteps.map((step, idx) => (
                  <Link to={step.route} key={step.num} className="block">
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-background/50 p-4 transition-colors hover:border-primary/40">
                      <div
                        className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.color}`}
                      >
                        <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">{step.num}</span>
                          <p className="text-sm font-semibold">{step.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    {idx < workflowSteps.length - 1 ? (
                      <div className="my-1 ml-7 h-3 w-px bg-border" />
                    ) : null}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* STEP DETAIL CARDS */}
        <section>
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Step Details</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">每個步驟做什麼</h2>
            <p className="mt-1 text-sm text-muted-foreground">點擊任一步驟卡片直接前往對應頁面</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {workflowSteps.map((step) => (
              <Link to={step.route} key={step.num}>
                <Card className="group h-full border-border bg-surface transition-all hover:border-primary/40 hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color}`}
                      >
                        <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">STEP {step.num}</span>
                    </div>
                    <CardTitle className="mt-4 text-lg">{step.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{step.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {step.actions.map((a) => (
                        <li key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      前往頁面 <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CORE FEATURES */}
        <section>
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Core Capabilities</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">平台核心能力</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="border-border bg-surface">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* TIPS */}
        <section>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent-violet/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">最佳實務建議</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: Workflow,
                  title: "依序完成 6 步驟",
                  desc: "每個步驟的輸出會成為下一步驟的輸入，建議首次使用時依序完成一遍。",
                },
                {
                  icon: Users,
                  title: "邀請相關利害關係人",
                  desc: "訪談階段建議由產品、工程、法務 / 風控共同參與，提升評估準確度。",
                },
                {
                  icon: Zap,
                  title: "持續更新證據",
                  desc: "Controls 頁面的證據上傳會即時影響殘餘風險計算，建議每次系統變更後更新。",
                },
                {
                  icon: BookOpen,
                  title: "善用 Knowledge Base",
                  desc: "遇到不確定的法規條文時，到 Knowledge Base 詢問 AI，會引用實際法條回答。",
                },
              ].map((tip) => (
                <div key={tip.title} className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3">
                  <tip.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{tip.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground">準備好開始第一個 AI 系統的治理流程了嗎？</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link to="/systems">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent-violet">
                <ShieldCheck className="h-4 w-4" />
                登錄第一個 AI 系統
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                返回 Dashboard
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AegisShell>
  );
}
