import type { InterviewData, GovernanceResult, ChecklistItem, ValidationGaps, RiskTier } from '@/types/governance';

export function runGovernanceAnalysis(interview: InterviewData): GovernanceResult {
  // Determine risk tier
  const isHighRisk =
    (interview.is_customer_facing && interview.uses_personal_data && interview.automation_level === 'Fully automated') ||
    (interview.impact_level === 'High' && interview.automation_level === 'Fully automated') ||
    (interview.is_customer_facing && interview.impact_level === 'High' && interview.uses_personal_data);

  const isMediumRisk =
    !isHighRisk &&
    (
      (interview.is_customer_facing && (interview.uses_personal_data || interview.automation_level === 'Fully automated')) ||
      interview.impact_level === 'Medium' ||
      (interview.impact_level === 'High' && interview.automation_level !== 'Fully automated')
    );

  const risk_tier: RiskTier = isHighRisk ? 'High' : isMediumRisk ? 'Medium' : 'Low';

  // Build risk explanation
  const reasons: string[] = [];
  if (interview.is_customer_facing) reasons.push('customer-facing');
  if (interview.uses_personal_data) reasons.push('uses personal or sensitive data');
  if (interview.automation_level === 'Fully automated') reasons.push('makes fully automated decisions');
  if (interview.impact_level === 'High') reasons.push('influences high-impact decisions');
  if (interview.impact_level === 'Medium') reasons.push('influences medium-impact decisions');

  const risk_explanation =
    risk_tier === 'Low'
      ? 'This system has a lower risk profile based on its limited scope, internal use, and existing controls.'
      : `This system is ${risk_tier.toLowerCase()} risk because it is ${reasons.join(', ')}.`;

  // Validation gaps
  const validation_gaps: ValidationGaps = {
    robustness: interview.has_robustness_testing
      ? '✅ Robustness testing processes are in place.'
      : 'No structured robustness or hallucination testing identified.',
    fairness: interview.has_bias_testing
      ? '✅ Bias and fairness testing processes are in place.'
      : 'No demographic bias testing process described.',
    safety: interview.has_security_testing
      ? '✅ AI security testing processes are in place.'
      : 'No adversarial prompt or model security testing described.',
    explainability: interview.has_model_card
      ? '✅ Model Card or explainability documentation is available.'
      : 'No Model Card or explainability documentation available.',
  };

  // Gap scores (0–5, higher = more concern)
  const gap_scores = {
    robustness: interview.has_robustness_testing ? 1 : (interview.is_customer_facing ? 5 : 4),
    fairness: interview.has_bias_testing ? 1 : (interview.impact_level === 'High' ? 5 : 4),
    safety: interview.has_security_testing ? 1 : (interview.system_type !== 'Machine Learning Model' ? 5 : 3),
    explainability: interview.has_model_card ? 1 : 4,
  };

  // Build checklist
  const checklist = buildChecklist(interview, risk_tier);

  return { risk_tier, risk_explanation, validation_gaps, checklist, gap_scores };
}

function buildChecklist(interview: InterviewData, riskTier: RiskTier): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Always high priority
  items.push({
    id: 'assign-owner',
    title: 'Assign AI System Owner',
    priority: 'high',
    objective: 'Ensure clear accountability for the AI system\'s governance, compliance, and ongoing oversight.',
    steps: [
      'Identify a senior team member responsible for the AI system',
      'Document their responsibilities including risk monitoring and incident response',
      'Establish escalation procedures for AI-related issues',
      'Schedule regular governance review meetings',
    ],
    tools: ['Internal wiki or Notion', 'RACI matrix template'],
    evidence: ['Ownership assignment document', 'RACI chart', 'Meeting cadence schedule'],
  });

  if (!interview.has_bias_testing) {
    items.push({
      id: 'bias-testing',
      title: 'Perform bias testing across user groups',
      priority: 'high',
      objective: 'Identify and mitigate demographic or group-based biases in AI outputs and decisions.',
      steps: [
        'Define protected attributes and user groups relevant to your use case',
        'Collect or generate representative test data for each group',
        'Run model predictions and compare outcome distributions',
        'Calculate fairness metrics (e.g., demographic parity, equalized odds)',
        'Document findings and implement mitigation strategies',
      ],
      tools: ['Fairlearn', 'AI Fairness 360 (AIF360)', 'SHAP', 'Python'],
      evidence: ['Bias test report with metrics', 'Fairness audit documentation', 'Remediation action log'],
    });
  }

  if (interview.automation_level === 'Fully automated' && interview.impact_level !== 'Low') {
    items.push({
      id: 'human-review',
      title: 'Introduce human review for high-impact outputs',
      priority: 'high',
      objective: 'Add human oversight to reduce risk of automated errors affecting users or business outcomes.',
      steps: [
        'Identify high-impact decision points in the AI workflow',
        'Design a human-in-the-loop review process',
        'Train reviewers on evaluating AI outputs and escalation criteria',
        'Implement a review queue with SLA tracking',
        'Measure and report review outcomes',
      ],
      tools: ['Task management system (Jira, Linear)', 'Custom review dashboard', 'Slack alerts'],
      evidence: ['Review process documentation', 'Review completion and override logs', 'SLA compliance reports'],
    });
  }

  const isLLM = interview.system_type === 'LLM Application' || interview.system_type === 'LLM with RAG';
  if (!interview.has_security_testing && isLLM) {
    items.push({
      id: 'adversarial-testing',
      title: 'Perform adversarial prompt safety testing',
      priority: 'high',
      objective: 'Protect against prompt injection, jailbreaking, data exfiltration, and other LLM attack vectors.',
      steps: [
        'Create a library of adversarial test cases (prompt injection, jailbreak attempts, data leakage probes)',
        'Test model responses against each attack vector',
        'Implement input validation, output filtering, and guardrails',
        'Set up monitoring for suspicious prompt patterns',
        'Schedule regular red-teaming exercises',
      ],
      tools: ['Garak', 'promptfoo', 'OWASP LLM Top 10', 'Custom red-teaming scripts'],
      evidence: ['Red team test report', 'Security test logs', 'Guardrail implementation documentation'],
    });
  }

  if (!interview.has_robustness_testing) {
    items.push({
      id: 'robustness-testing',
      title: 'Implement robustness and reliability testing',
      priority: riskTier === 'High' ? 'high' : 'recommended',
      objective: 'Ensure the AI system performs reliably under varied inputs and edge cases.',
      steps: [
        'Define edge cases and boundary conditions for your use case',
        'Create adversarial and out-of-distribution test datasets',
        'Run stress tests and measure failure rates',
        'Implement automated regression testing in CI/CD pipeline',
      ],
      tools: ['pytest', 'Great Expectations', 'Custom test harness', isLLM ? 'promptfoo' : 'scikit-learn'],
      evidence: ['Test results report', 'Edge case catalog', 'CI/CD test configuration'],
    });
  }

  // Recommended items
  if (!interview.has_model_card) {
    items.push({
      id: 'model-card',
      title: 'Create Model Card documentation',
      priority: 'recommended',
      objective: 'Provide transparency about the AI system\'s purpose, capabilities, limitations, and intended use.',
      steps: [
        'Document model purpose, intended use cases, and out-of-scope uses',
        'Describe data sources, preprocessing steps, and training methodology',
        'List known limitations, failure modes, and bias considerations',
        'Include performance metrics and evaluation results across user groups',
        'Publish internally and schedule regular updates',
      ],
      tools: ['Model Card Toolkit', 'Markdown or Notion template', 'Google Model Card template'],
      evidence: ['Completed Model Card document', 'Version history log'],
    });
  }

  items.push({
    id: 'drift-monitoring',
    title: 'Monitor model performance drift',
    priority: 'recommended',
    objective: 'Detect when model accuracy or behavior degrades over time due to data distribution changes.',
    steps: [
      'Define key performance metrics and acceptable thresholds',
      'Set up automated monitoring dashboards',
      'Configure alerts for metric threshold breaches',
      'Establish retraining triggers and data refresh schedules',
    ],
    tools: ['Evidently AI', 'Weights & Biases', 'MLflow', 'Datadog', 'Custom monitoring'],
    evidence: ['Monitoring dashboard screenshots', 'Alert configuration documentation', 'Drift detection reports'],
  });

  items.push({
    id: 'output-logging',
    title: 'Log AI outputs for auditability',
    priority: 'recommended',
    objective: 'Maintain a comprehensive audit trail of AI inputs, outputs, and decisions for compliance and debugging.',
    steps: [
      'Implement structured logging for all AI inputs and outputs',
      'Define log retention policies compliant with regulations',
      'Enable search, filtering, and export of audit logs',
      'Create periodic audit report templates',
    ],
    tools: ['ELK Stack', 'Datadog', 'AWS CloudWatch', 'Google Cloud Logging'],
    evidence: ['Logging architecture document', 'Sample audit reports', 'Retention policy documentation'],
  });

  return items;
}

// Generate report markdown for different report types
export function generateRiskSummaryReport(interview: InterviewData, result: GovernanceResult): string {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const highPriority = result.checklist.filter(c => c.priority === 'high');

  return `# AI Risk Summary Report

**System:** ${interview.system_name}
**Type:** ${interview.system_type}
**Assessment Date:** ${now}

---

## System Overview

- **System Type:** ${interview.system_type}
- **Customer-Facing:** ${interview.is_customer_facing ? 'Yes' : 'No'}
- **Decision Impact:** ${interview.impact_level}
- **Automation Level:** ${interview.automation_level}
- **Uses Personal Data:** ${interview.uses_personal_data ? 'Yes' : 'No'}
- **Data Sources:** ${interview.data_sources || 'Not specified'}

---

## Risk Classification

### Risk Tier: **${result.risk_tier}**

${result.risk_explanation}

---

## Key Validation Gaps

| Area | Status |
|------|--------|
| Robustness | ${result.validation_gaps.robustness} |
| Fairness | ${result.validation_gaps.fairness} |
| AI Safety | ${result.validation_gaps.safety} |
| Explainability | ${result.validation_gaps.explainability} |

---

## Top Priority Controls

${highPriority.map((c, i) => `${i + 1}. **${c.title}** — ${c.objective}`).join('\n')}

---

*Generated by Aegis AI — AI Governance Platform*
`;
}

export function generateModelCardReport(interview: InterviewData, result: GovernanceResult): string {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `# AI Model Card

**System:** ${interview.system_name}
**Generated:** ${now}

---

## Model Purpose

**System Type:** ${interview.system_type}

This AI system is designed to ${interview.is_customer_facing ? 'serve external customers' : 'support internal operations'}. ${interview.impact_level === 'High' ? 'It influences high-impact decisions such as credit, pricing, approval, or risk scoring.' : interview.impact_level === 'Medium' ? 'It influences medium-impact operational decisions.' : 'It supports low-impact operational tasks.'}

---

## Data Sources

${interview.data_sources || 'Data sources have not been documented. This should be addressed as a priority.'}

**Uses Personal/Sensitive Data:** ${interview.uses_personal_data ? 'Yes — requires additional data protection measures' : 'No'}

---

## Automation & Human Oversight

- **Automation Level:** ${interview.automation_level}
${interview.automation_level === 'Fully automated' ? '- ⚠️ No human review in the decision loop — consider adding oversight for high-impact outputs' : interview.automation_level === 'Human review sometimes' ? '- Human review is applied selectively' : '- All outputs are reviewed by humans before action'}

---

## Known Limitations

${!interview.has_robustness_testing ? '- Robustness and edge-case behavior has not been formally tested\n' : ''}${!interview.has_bias_testing ? '- Fairness and bias across user groups has not been assessed\n' : ''}${!interview.has_security_testing ? '- Security against adversarial attacks has not been evaluated\n' : ''}${interview.has_robustness_testing && interview.has_bias_testing && interview.has_security_testing ? '- Testing has been conducted across robustness, fairness, and security dimensions\n' : ''}

---

## Explainability

${interview.has_model_card
    ? 'Existing Model Card or AI documentation is available. Review and keep updated regularly.'
    : 'No formal Model Card or explainability documentation exists. Creating one is recommended to meet governance and transparency standards.'}

---

## Safety Considerations

${result.risk_tier === 'High' ? '⚠️ **This system is classified as HIGH RISK.** Additional safeguards, monitoring, and human oversight are strongly recommended before or during production deployment.' : result.risk_tier === 'Medium' ? '⚡ **This system is classified as MEDIUM RISK.** Recommended safeguards should be implemented to reduce potential harm.' : '✅ **This system is classified as LOW RISK.** Standard monitoring and periodic review is recommended.'}

---

*Generated by Aegis AI — AI Governance Platform*
`;
}

export function generateActionPlanReport(interview: InterviewData, result: GovernanceResult): string {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const highPriority = result.checklist.filter(c => c.priority === 'high');
  const recommended = result.checklist.filter(c => c.priority === 'recommended');

  return `# AI Governance Action Plan

**System:** ${interview.system_name}
**Risk Tier:** ${result.risk_tier}
**Generated:** ${now}

---

## Prioritized Checklist

### 🔴 Now — High Priority

${highPriority.map((c, i) => `#### ${i + 1}. ${c.title}

**Objective:** ${c.objective}

**Steps:**
${c.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}

**Suggested Tools:** ${c.tools.join(', ')}

**Evidence to Keep:** ${c.evidence.join(', ')}
`).join('\n---\n\n')}

---

### 🟡 Next — Recommended

${recommended.map((c, i) => `#### ${i + 1}. ${c.title}

**Objective:** ${c.objective}

**Steps:**
${c.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}

**Suggested Tools:** ${c.tools.join(', ')}

**Evidence to Keep:** ${c.evidence.join(', ')}
`).join('\n---\n\n')}

---

### 🟢 Later — Ongoing

1. **Schedule quarterly governance reviews** — Revisit risk classification and control effectiveness
2. **Update Model Card** — Reflect any system changes, new data sources, or performance findings
3. **Conduct annual red-teaming** — Test for emerging attack vectors and evolving risks

---

*Generated by Aegis AI — AI Governance Platform*
`;
}
