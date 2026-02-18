# Aegis AI MVP Decisions

## 1) Deterministic governance first
Risk tier and validation gaps are deterministic and explainable by rule.  
Reason: MVP requires predictable, testable behavior.

## 2) Local-first persistence
Primary MVP storage uses localStorage (`src/lib/aegis/storage.ts`).  
Reason: fastest end-to-end delivery with no migration dependency.

## 3) Template-first control explainer
Control details are generated from structured templates.  
Reason: reliable baseline even without LLM availability.

## 4) Optional AI refine boundary
`Refine with AI Guidance` is present but disabled unless configured via `VITE_AI_GUIDANCE_ENABLED=true`.  
Reason: keeps UX contract now, enables future provider integration without reworking UI.

## 5) Route compatibility preserved
Legacy routes (`/new`, `/feature/:id`, `/feature/:id/report`, `/about`) redirect to new Aegis pages.  
Reason: avoid broken links and reduce migration risk.

## 6) Tokenized theming
Theme uses required tokens (`background`, `surface`, `text`, `mutedText`, `border`, `primary`, `success`, `warning`, `danger`, `aiBubble`, `userBubble`) and supports system mode.  
Reason: consistent appearance across all components and clean dark/light behavior.

