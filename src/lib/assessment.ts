import type { AIFeature, Assessment, CategoryScores, RiskTier } from '@/types/governance';

interface AssessmentResult {
  risk_tier: RiskTier;
  rationale: string[];
  category_scores: CategoryScores;
  gaps: string[];
  recommendations: string[];
}

// Heuristic-based assessment fallback when LLM is not available
export function runHeuristicAssessment(feature: AIFeature): AssessmentResult {
  let riskScore = 0;
  const rationale: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];

  // Calculate risk factors
  const hasSensitiveData = feature.user_data_types.includes('sensitive: health/financial/identity');
  const hasExternalTransfer = feature.external_data_transfer;
  const isFullyAutomated = feature.autonomy_level === 'Fully automated';
  const hasHighImpact = feature.impact_types.some(t => 
    t === 'affects eligibility/access' || t === 'financial outcomes' || t === 'content visibility/moderation'
  );
  const targetsMinors = feature.target_users.includes('minors');
  const hasHumanOversight = feature.safeguards.human_oversight;
  const hasLogging = feature.safeguards.logging_monitoring;
  const hasAbuseMitigation = feature.safeguards.abuse_mitigation;

  // High risk conditions
  if (hasSensitiveData && hasExternalTransfer && hasHighImpact) {
    riskScore += 3;
    rationale.push('Processes sensitive data with external transfer and high-impact outcomes');
  }

  if (targetsMinors) {
    riskScore += 2;
    rationale.push('System targets minors, requiring enhanced protections');
  }

  // Medium risk factors
  if (hasExternalTransfer) {
    riskScore += 1;
    rationale.push('Data is transferred to external parties');
  }

  if (isFullyAutomated) {
    riskScore += 1;
    rationale.push('Fully automated without human review of outputs');
  }

  if (hasHighImpact) {
    riskScore += 1;
    rationale.push('System decisions have significant impact on users');
  }

  if (feature.model_source === 'External API') {
    riskScore += 0.5;
    rationale.push('Uses external AI API which may have its own data handling practices');
  }

  // Risk reductions from safeguards
  if (hasHumanOversight) {
    riskScore -= 0.5;
    rationale.push('Human oversight is in place to review AI outputs');
  } else {
    gaps.push('No human oversight mechanism defined');
    recommendations.push('Implement human review process for AI outputs');
  }

  if (hasLogging) {
    riskScore -= 0.5;
    rationale.push('Logging and monitoring is enabled for auditing');
  } else {
    gaps.push('Logging and monitoring not configured');
    recommendations.push('Enable comprehensive logging for audit trails');
  }

  if (hasAbuseMitigation) {
    riskScore -= 0.5;
    rationale.push('Abuse mitigation controls are implemented');
  } else {
    gaps.push('No abuse mitigation strategy in place');
    recommendations.push('Develop and implement abuse prevention measures');
  }

  // Additional gaps and recommendations based on feature attributes
  if (feature.ai_type === 'LLM feature' && !hasAbuseMitigation) {
    gaps.push('LLM features are particularly susceptible to prompt injection');
    recommendations.push('Implement input validation and output filtering for LLM');
  }

  if (hasExternalTransfer && !feature.description?.toLowerCase().includes('consent')) {
    gaps.push('External data transfer without documented consent mechanism');
    recommendations.push('Document user consent flow for external data sharing');
  }

  if (feature.stage === 'Live' && !hasLogging) {
    gaps.push('Production system without monitoring');
    recommendations.push('Critical: Enable logging before production deployment');
  }

  if (hasSensitiveData) {
    recommendations.push('Conduct data protection impact assessment (DPIA)');
    if (!hasHumanOversight) {
      recommendations.push('Consider mandatory human review for decisions affecting sensitive data');
    }
  }

  // Determine risk tier
  let risk_tier: RiskTier;
  if (riskScore >= 3) {
    risk_tier = 'High';
  } else if (riskScore >= 1.5) {
    risk_tier = 'Medium';
  } else {
    risk_tier = 'Low';
  }

  // Calculate category scores
  const category_scores: CategoryScores = {
    privacy: calculatePrivacyScore(feature),
    safety_misuse: calculateSafetyScore(feature),
    fairness: calculateFairnessScore(feature),
    transparency: calculateTransparencyScore(feature),
    accountability: calculateAccountabilityScore(feature),
  };

  // Ensure we have at least some rationale
  if (rationale.length === 0) {
    rationale.push('Standard risk profile with no major concerns identified');
  }

  return {
    risk_tier,
    rationale,
    category_scores,
    gaps: gaps.length > 0 ? gaps : ['No critical governance gaps identified'],
    recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring and periodic review'],
  };
}

function calculatePrivacyScore(feature: AIFeature): number {
  let score = 0;
  if (feature.user_data_types.includes('sensitive: health/financial/identity')) score += 2;
  if (feature.user_data_types.includes('account info')) score += 1;
  if (feature.user_data_types.includes('user-generated content')) score += 1;
  if (feature.external_data_transfer) score += 1;
  return Math.min(score, 5);
}

function calculateSafetyScore(feature: AIFeature): number {
  let score = 0;
  if (feature.autonomy_level === 'Fully automated') score += 2;
  if (feature.ai_type === 'LLM feature') score += 1;
  if (feature.target_users.includes('minors')) score += 2;
  if (!feature.safeguards.abuse_mitigation) score += 1;
  return Math.min(score, 5);
}

function calculateFairnessScore(feature: AIFeature): number {
  let score = 0;
  if (feature.impact_types.includes('affects eligibility/access')) score += 2;
  if (feature.impact_types.includes('financial outcomes')) score += 2;
  if (feature.ai_type === 'Classification-Detection') score += 1;
  if (feature.ai_type === 'Recommendation-Ranking') score += 1;
  return Math.min(score, 5);
}

function calculateTransparencyScore(feature: AIFeature): number {
  let score = 1; // Base score
  if (feature.model_source === 'External API') score += 1;
  if (feature.autonomy_level === 'Fully automated') score += 1;
  if (!feature.safeguards.logging_monitoring) score += 1;
  if (feature.impact_types.includes('content visibility/moderation')) score += 1;
  return Math.min(score, 5);
}

function calculateAccountabilityScore(feature: AIFeature): number {
  let score = 0;
  if (!feature.safeguards.human_oversight) score += 2;
  if (!feature.safeguards.logging_monitoring) score += 1;
  if (feature.stage === 'Live') score += 1;
  if (feature.autonomy_level === 'Fully automated') score += 1;
  return Math.min(score, 5);
}

export function generateMarkdownSummary(feature: AIFeature, assessment: Assessment): string {
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `# AI Governance Summary

**Feature:** ${feature.name}  
**Product/Service:** ${feature.product_name || 'Not specified'}  
**Team:** ${feature.team || 'Not specified'}  
**Stage:** ${feature.stage}  
**Assessment Date:** ${now}

---

## AI Feature Overview

${feature.description || 'No description provided.'}

**AI System Type:** ${feature.ai_type || 'Not specified'}  
**Model Source:** ${feature.model_source || 'Not specified'}  
**Autonomy Level:** ${feature.autonomy_level || 'Not specified'}

---

## System & Data

### Data Types Processed
${feature.user_data_types.length > 0 ? feature.user_data_types.map(t => `- ${t}`).join('\n') : '- None specified'}

### Target Users
${feature.target_users.length > 0 ? feature.target_users.map(t => `- ${t}`).join('\n') : '- Not specified'}

### External Data Transfer
${feature.external_data_transfer ? '⚠️ Yes - Data is transferred to external parties' : '✅ No external data transfer'}

### Impact Types
${feature.impact_types.length > 0 ? feature.impact_types.map(t => `- ${t}`).join('\n') : '- None identified'}

---

## Risk Assessment

### Risk Tier: **${assessment.risk_tier}**

### Rationale
${assessment.rationale.map(r => `- ${r}`).join('\n')}

### Category Scores (0-5 scale, higher = more concern)

| Category | Score |
|----------|-------|
| Privacy | ${assessment.category_scores.privacy}/5 |
| Safety & Misuse | ${assessment.category_scores.safety_misuse}/5 |
| Fairness | ${assessment.category_scores.fairness}/5 |
| Transparency | ${assessment.category_scores.transparency}/5 |
| Accountability | ${assessment.category_scores.accountability}/5 |

---

## Current Safeguards

- Human Oversight: ${feature.safeguards.human_oversight ? '✅ Enabled' : '❌ Not enabled'}
- Logging & Monitoring: ${feature.safeguards.logging_monitoring ? '✅ Enabled' : '❌ Not enabled'}
- Abuse Mitigation: ${feature.safeguards.abuse_mitigation ? '✅ Enabled' : '❌ Not enabled'}

---

## Required Safeguards Before Launch

${assessment.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

## Open Questions / Next Steps

${assessment.gaps.map(g => `- ${g}`).join('\n')}

---

*This governance summary was generated by AI Governance Copilot. Designed for private client deployment; store data locally within the client environment.*
`;
}
