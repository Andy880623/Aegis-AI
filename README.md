# Aegis AI — Responsible AI Governance Platform

> Turn any AI system into a **governed, auditable, and safer** system in about 10 minutes.

Aegis AI is a responsible-AI governance copilot for product, risk, and compliance
teams. It interviews your team about an AI system, computes a deterministic risk
tier, identifies validation gaps, generates a prioritized internal-control
checklist, and exports audit-ready reports — all aligned to leading AI standards
(EU AI Act, NIST AI RMF, ISO/IEC 42001, UK AI Principles, Singapore AI Verify,
and Taiwan FSC AI Guidelines).

- 🌐 **Live demo:** https://aegisaidemo.lovable.app
- 🛠️ **Built on:** [Lovable](https://lovable.dev) · React · TypeScript · Vite · Tailwind · shadcn/ui · Lovable Cloud (Supabase)

---

## Table of contents

1. [Why Aegis AI](#why-aegis-ai)
2. [Key features](#key-features)
3. [Platform workflow](#platform-workflow)
4. [Standards coverage](#standards-coverage)
5. [Tech stack](#tech-stack)
6. [Project structure](#project-structure)
7. [Getting started](#getting-started)
8. [Environment variables](#environment-variables)
9. [Demo data](#demo-data)
10. [Available scripts](#available-scripts)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Editing this project](#editing-this-project)
14. [Architecture & design decisions](#architecture--design-decisions)
15. [Roadmap](#roadmap)
16. [License](#license)

---

## Why Aegis AI

Most teams ship AI features faster than their governance process can keep up.
Spreadsheets, ad-hoc questionnaires, and PDF policies don't scale and aren't
auditable. Aegis AI replaces that with a **structured, deterministic, and
explainable** workflow:

- **Deterministic risk engine** — every Low/Medium/High classification is
  reproducible and explainable by rule (no black-box LLM verdicts).
- **Standards-aligned controls** — each recommended control cites the relevant
  clause in EU AI Act, NIST AI RMF, ISO 42001, and more.
- **Local-first MVP** — works entirely in the browser via `localStorage`, with
  optional Lovable Cloud (Supabase) backend for evidence storage, RAG knowledge
  base, and edge functions.
- **Audit-ready exports** — Markdown, PDF, DOCX, and XLSX reports out of the box.

---

## Key features

| Area | What it does |
|---|---|
| 🎙 **Guided interview** | A wizard collects an AI system profile (use case, data, automation, testing posture) and persists it locally. |
| ⚖️ **Risk tier engine** | Deterministic rules map the profile to **Low / Medium / High** with full rationale and triggers. |
| 🧩 **Validation gap analysis** | Identifies gaps across Robustness, Fairness, Safety, and Explainability. |
| ✅ **Control generator** | Selects and prioritizes controls from a curated KB of 60+ controls across 8 categories. |
| 📊 **Dashboard** | Portfolio-level view of every registered AI system, residual risk, and control progress. |
| 📁 **Evidence uploader** | Attach evidence to controls; optional edge-function virus/PII scan via Lovable Cloud. |
| 📚 **Knowledge base (RAG)** | Ingest policies and query them with retrieval-augmented generation. |
| 📝 **Reports** | Export risk assessment, control plan, and executive summary as Markdown / PDF / DOCX / XLSX. |
| 🌓 **Theming** | Light / Dark / System modes with full design-token coverage. |

---

## Platform workflow

```
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ 1. Register  │ → │ 2. AI-guided │ → │ 3. Risk &    │ → │ 4. Control   │
 │  AI system   │   │  interview   │   │  gap engine  │   │  checklist   │
 └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                                                                  │
                          ┌───────────────────────────────────────┘
                          ▼
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ 5. Evidence  │ → │ 6. Residual  │ → │ 7. Reports & │
 │  collection  │   │  risk view   │   │  exports     │
 └──────────────┘   └──────────────┘   └──────────────┘
```

1. **Register** an AI system from the **Systems** page or open the demo seed.
2. **Interview** the system in the **Workspace** — left panel asks structured
   questions, right panel updates governance outputs in real time.
3. The **Risk Tier Engine** (`src/lib/aegis/risk-tier.ts`) computes a
   deterministic Low/Medium/High classification with explicit triggers.
4. The **Control Generator** (`src/lib/aegis/control-generator.ts`) picks
   applicable controls from the KB and ranks them High / Recommended / Optional.
5. Upload **evidence** per control to track implementation maturity.
6. The **Residual Risk** page rolls up unmitigated risk by category.
7. Generate **Reports** (Markdown, PDF, DOCX, XLSX) for auditors and stakeholders.

An interactive walkthrough of this flow is on the landing page.

---

## Standards coverage

Each control surfaced by Aegis AI cites the relevant clause across:

| Standard | Region | Source |
|---|---|---|
| EU AI Act (Regulation 2024/1689) | EU | [eur-lex.europa.eu](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) |
| NIST AI Risk Management Framework 1.0 | USA | [nist.gov](https://www.nist.gov/itl/ai-risk-management-framework) |
| ISO/IEC 42001:2023 | International | [iso.org](https://www.iso.org/standard/81230.html) |
| UK Pro-Innovation AI Principles | UK | [gov.uk](https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach) |
| Singapore AI Verify / MGF | Singapore | [aiverifyfoundation.sg](https://aiverifyfoundation.sg/) |
| Taiwan FSC AI Guidelines | Taiwan | [fsc.gov.tw](https://www.fsc.gov.tw/) |

See `src/lib/aegis/standards.ts` for the full clause map.

---

## Tech stack

- **Frontend:** React 18, TypeScript 5, Vite 5
- **Styling:** Tailwind CSS v3, shadcn/ui, `tailwindcss-animate`, `next-themes`
- **Routing & state:** React Router v6, TanStack Query, React Hook Form + Zod
- **Charts & UX:** Recharts, Embla Carousel, Sonner, Vaul
- **Documents:** `jspdf` + `jspdf-autotable`, `docx`, `xlsx`, `file-saver`
- **Backend (optional):** Lovable Cloud (Supabase) — Postgres, Auth, Storage,
  Edge Functions for `evidence-scan`, `rag-ingest`, `rag-query`
- **Tests:** Vitest + Testing Library + jsdom
- **Tooling:** ESLint 9, TypeScript ESLint, SWC

---

## Project structure

```
src/
├── components/
│   ├── landing/          # Hero, interactive walkthrough
│   ├── layout/           # AegisShell, AppLayout, ThemeToggle
│   ├── ui/               # shadcn/ui primitives
│   └── workspace/        # Interview, governance output, control drawer
├── lib/aegis/
│   ├── schema.ts         # AI_System_Profile defaults & normalization
│   ├── risk-tier.ts      # Deterministic risk engine
│   ├── validation-gaps.ts
│   ├── controls-kb.ts    # Control knowledge base (60+ controls)
│   ├── control-generator.ts
│   ├── standards.ts      # Standards & clause citations
│   ├── reports.ts        # Markdown report generator
│   ├── report-pdf.ts     # PDF export
│   ├── report-docx.ts    # DOCX export
│   ├── report-xlsx.ts    # XLSX export
│   ├── evidence.ts       # Evidence storage helpers
│   ├── rag-client.ts     # Knowledge-base RAG client
│   ├── storage.ts        # localStorage persistence + activity feed
│   └── demo-seed.ts      # Auto-seed three demo systems
├── pages/
│   ├── Landing.tsx       # Marketing + interactive walkthrough
│   ├── Dashboard.tsx     # Portfolio dashboard
│   ├── Workspace.tsx     # Split-screen interview + governance
│   ├── AISystems.tsx     # System list / registration
│   ├── AISystemDetail.tsx
│   ├── Controls.tsx      # Control checklist
│   ├── ResidualRisk.tsx  # Residual risk rollup
│   ├── Reports.tsx       # Report exports
│   ├── KnowledgeBase.tsx # RAG ingest & query
│   └── Settings.tsx
├── types/aegis.ts        # Canonical domain contracts
└── integrations/supabase # Auto-generated client & types (DO NOT EDIT)

supabase/
└── functions/
    ├── evidence-scan/    # Optional evidence scanning
    ├── rag-ingest/       # KB ingest endpoint
    └── rag-query/        # KB query endpoint
```

---

## Getting started

### Prerequisites

- **Node.js ≥ 18** (use [nvm](https://github.com/nvm-sh/nvm) to install)
- **npm** (or pnpm / bun)

### Local development

```sh
# 1. Clone
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install
npm install

# 3. Run the dev server (Vite) on http://localhost:8080
npm run dev
```

The app boots into the **Landing page** with an interactive walkthrough and
three pre-seeded demo systems covering Low / Medium / High risk tiers.

---

## Environment variables

The `.env` file is **auto-managed** by Lovable Cloud — do not edit it manually.
It exposes:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Lovable Cloud (Supabase) project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key (safe to ship) |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |
| `VITE_AI_GUIDANCE_ENABLED` | Set to `true` to enable optional "Refine with AI Guidance" buttons |

Secrets (e.g. for edge functions) are managed via Lovable Cloud's secret store
— never commit private keys to the repo.

---

## Demo data

On first visit, the app auto-seeds three sample AI systems into `localStorage`
so every page renders with realistic content:

| System | Risk | Why |
|---|---|---|
| **Lumen Dynamic Pricing Engine** | 🔴 High | Customer-facing, fully automated, weak controls |
| **Atlas Customer Support Copilot** | 🟡 Medium | LLM/RAG with partial automation, moderate controls |
| **Sage Internal Knowledge Search** | 🟢 Low | Internal-only, mature controls |

Seeding logic lives in `src/lib/aegis/demo-seed.ts`. It's versioned (`SEED_VERSION`)
and **only refreshes systems whose IDs start with `sys_demo_`** — your own
systems are never overwritten.

To reset the demo, clear browser storage for the site or bump `SEED_VERSION`.

---

## Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build (unminified) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Testing

Unit tests live under `src/test/` and cover the deterministic engines:

- `risk-tier.test.ts` — risk classification rules
- `validation-gaps.test.ts` — gap-detection rules

Run them with:

```sh
npm run test
```

---

## Deployment

### Via Lovable (one click)

Open the [Lovable project](https://lovable.dev) and click **Share → Publish**.
The app is currently published at **https://aegisaidemo.lovable.app**.

### Custom domain

Project → Settings → Domains → **Connect Domain**. See the
[Lovable docs](https://docs.lovable.dev/features/custom-domain#custom-domain).

### Self-hosting

`npm run build` produces a static `dist/` directory deployable to any static
host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.). The Lovable
Cloud backend continues to work from any origin as long as `VITE_SUPABASE_*`
env vars are present at build time.

---

## Editing this project

You can iterate on Aegis AI in any of the following ways — changes sync both
directions automatically.

- **In Lovable** — open the project and start prompting. Commits are pushed to
  this repo automatically.
- **In your local IDE** — clone, edit, push. Pushed changes appear in Lovable.
- **Directly on GitHub** — use the pencil icon to edit a file in the browser.
- **In GitHub Codespaces** — *Code → Codespaces → New codespace*.

> ⚠️ **Do NOT edit** these auto-generated files — they will be overwritten:
> - `src/integrations/supabase/client.ts`
> - `src/integrations/supabase/types.ts`
> - `.env`
> - `supabase/config.toml` (project-level fields)

---

## Architecture & design decisions

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`DECISIONS.md`](./DECISIONS.md)
for the rationale behind:

- Deterministic-first governance engines (vs. LLM verdicts)
- Local-first persistence with optional cloud sync
- Template-first control explainers with optional AI refine boundary
- Tokenized theming with required design tokens
- Backwards-compatible legacy routes (`/new`, `/feature/:id`, etc.)

---

## Roadmap

- [ ] Multi-tenant workspaces with role-based access
- [ ] Continuous monitoring connectors (logs, drift, incidents)
- [ ] Auditor-facing read-only share links
- [ ] Configurable control KB per industry vertical
- [ ] Native integrations (Jira, Linear, ServiceNow) for control workflow

---

## License

© 2026 Aegis AI. All rights reserved.

This repository is provided for demonstration and evaluation purposes. Please
contact the project owner before using it in production.
