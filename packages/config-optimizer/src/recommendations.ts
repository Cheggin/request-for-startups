import {
  ERROR_RATE_THRESHOLD,
  HIGH_COST_THRESHOLD,
  LOW_COST_THRESHOLD,
  GOOD_QUALITY_THRESHOLD,
  POOR_QUALITY_THRESHOLD,
  CONFIDENCE_HIGH,
  CONFIDENCE_MEDIUM,
  CONFIDENCE_LOW,
  MODEL_TIERS,
} from "./constants.js";
import type { AgentMetrics, Recommendation } from "./types.js";

/**
 * Generates config change recommendations based on agent metrics.
 * Each recommendation includes a confidence score and supporting evidence.
 */
export function generateRecommendations(metrics: AgentMetrics[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const m of metrics) {
    recommendations.push(...analyzeAgent(m));
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

function analyzeAgent(m: AgentMetrics): Recommendation[] {
  const recs: Recommendation[] = [];

  recs.push(...checkErrorRate(m));
  recs.push(...checkModelDowngrade(m));
  recs.push(...checkModelUpgrade(m));

  return recs;
}

/**
 * If error rate > 20%, suggest adding hooks or changing model tier.
 */
function checkErrorRate(m: AgentMetrics): Recommendation[] {
  if (m.errorRate > ERROR_RATE_THRESHOLD) {
    return [
      {
        type: "add_hooks",
        agent: m.agent,
        description: `Agent "${m.agent}" has a ${(m.errorRate * 100).toFixed(0)}% error rate. Suggest adding validation hooks or upgrading model tier.`,
        confidence: m.errorRate > 0.4 ? CONFIDENCE_HIGH : CONFIDENCE_MEDIUM,
        evidence: [
          `Error rate: ${(m.errorRate * 100).toFixed(0)}%`,
          `Retry rate: ${m.retryRate.toFixed(2)} per task`,
          `Tasks analyzed: ${m.taskCount}`,
        ],
        suggestedChange: {
          path: "hooks",
          action: "add_validation_hook",
          reason: "High error rate indicates insufficient pre-execution validation",
        },
      },
    ];
  }

  return [];
}

/**
 * If cost per task is high but quality is good, suggest downgrading model.
 */
function checkModelDowngrade(m: AgentMetrics): Recommendation[] {
  if (
    m.avgCostPerTask > HIGH_COST_THRESHOLD &&
    m.avgQualityScore !== null &&
    m.avgQualityScore >= GOOD_QUALITY_THRESHOLD &&
    m.currentModel !== null
  ) {
    const currentTierIdx = MODEL_TIERS.indexOf(m.currentModel as (typeof MODEL_TIERS)[number]);
    if (currentTierIdx <= 0) return [];

    const suggestedModel = MODEL_TIERS[currentTierIdx - 1];

    return [
      {
        type: "downgrade_model",
        agent: m.agent,
        description: `Agent "${m.agent}" costs $${m.avgCostPerTask.toFixed(2)}/task with ${(m.avgQualityScore * 100).toFixed(0)}% quality. Suggest downgrading from ${m.currentModel} to ${suggestedModel}.`,
        confidence: CONFIDENCE_LOW,
        evidence: [
          `Avg cost per task: $${m.avgCostPerTask.toFixed(2)}`,
          `Quality score: ${(m.avgQualityScore * 100).toFixed(0)}%`,
          `Current model: ${m.currentModel}`,
          `Tasks analyzed: ${m.taskCount}`,
        ],
        suggestedChange: {
          path: "model",
          from: m.currentModel,
          to: suggestedModel,
        },
      },
    ];
  }

  return [];
}

/**
 * If cost per task is low but quality is poor, suggest upgrading model.
 */
function checkModelUpgrade(m: AgentMetrics): Recommendation[] {
  if (
    m.avgCostPerTask < LOW_COST_THRESHOLD &&
    m.avgQualityScore !== null &&
    m.avgQualityScore < POOR_QUALITY_THRESHOLD &&
    m.currentModel !== null
  ) {
    const currentTierIdx = MODEL_TIERS.indexOf(m.currentModel as (typeof MODEL_TIERS)[number]);
    if (currentTierIdx < 0 || currentTierIdx >= MODEL_TIERS.length - 1) return [];

    const suggestedModel = MODEL_TIERS[currentTierIdx + 1];

    return [
      {
        type: "upgrade_model",
        agent: m.agent,
        description: `Agent "${m.agent}" costs $${m.avgCostPerTask.toFixed(2)}/task but quality is ${(m.avgQualityScore * 100).toFixed(0)}%. Suggest upgrading from ${m.currentModel} to ${suggestedModel}.`,
        confidence: CONFIDENCE_MEDIUM,
        evidence: [
          `Avg cost per task: $${m.avgCostPerTask.toFixed(2)}`,
          `Quality score: ${(m.avgQualityScore * 100).toFixed(0)}%`,
          `Current model: ${m.currentModel}`,
          `Tasks analyzed: ${m.taskCount}`,
        ],
        suggestedChange: {
          path: "model",
          from: m.currentModel,
          to: suggestedModel,
        },
      },
    ];
  }

  return [];
}
