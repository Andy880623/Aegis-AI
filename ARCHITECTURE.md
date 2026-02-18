# Aegis AI MVP Architecture

## Overview
Aegis AI is implemented as a local-first React SPA with deterministic governance engines and a guided copilot workflow.

## Main Modules
- `src/pages/Workspace.tsx`
  - Split-screen governance workspace.
  - Left: guided interview wizard.
  - Right: live governance outputs.
- `src/components/workspace/*`
  - `InterviewAgentPanel`: step-by-step profile capture.
  - `GovernanceOutputPanel`: risk, gaps, controls.
  - `ControlDetailDrawer`: template-first explainer with optional AI refine button.
- `src/lib/aegis/*`
  - `schema.ts`: default profile and normalization.
  - `storage.ts`: localStorage persistence and activity feed.
  - `risk-tier.ts`: deterministic risk engine.
  - `validation-gaps.ts`: deterministic gap engine.
  - `controls-kb.ts`: control knowledge base (>=60 controls).
  - `control-generator.ts`: applicability + priority selection.
  - `reports.ts`: markdown report generation.
  - `ai-refine.ts`: AI refine integration boundary (optional).
- `src/types/aegis.ts`
  - Canonical domain contracts for profile, engines, controls, and outputs.

## Data Flow
1. Interview updates `AI_System_Profile`.
2. Risk Tier Engine computes `RiskTierResult`.
3. Validation Gap Engine computes required dimensions + gaps.
4. Control Generator selects/prioritizes controls from KB.
5. Report generator outputs markdown artifacts.
6. Profile and activity are persisted in localStorage.

## UI Shell
- `AegisShell` provides:
  - Left sidebar navigation.
  - Top header search, theme toggle, notifications, profile placeholder.
- Theme system uses `next-themes` with Light/Dark/System and CSS tokens.

