/** Threshold above which error rate triggers a recommendation */
export const ERROR_RATE_THRESHOLD = 0.2;

/** If avg turns < maxTurns * this factor, suggest lowering maxTurns */
export const TURN_UNDERUSE_FACTOR = 0.5;

/** If agent hits budget limit more than this fraction of tasks, suggest raising */
export const BUDGET_HIT_RATE_THRESHOLD = 0.3;

/** Cost per task threshold (USD) above which we consider downgrading model */
export const HIGH_COST_THRESHOLD = 2.0;

/** Cost per task threshold (USD) below which we consider upgrading model */
export const LOW_COST_THRESHOLD = 0.1;

/** Quality score threshold for "good" quality (0-1 scale) */
export const GOOD_QUALITY_THRESHOLD = 0.8;

/** Quality score threshold for "poor" quality (0-1 scale) */
export const POOR_QUALITY_THRESHOLD = 0.5;

/** Minimum number of tasks before generating recommendations */
export const MIN_TASKS_FOR_RECOMMENDATION = 5;

/** Confidence levels */
export const CONFIDENCE_HIGH = 0.9;
export const CONFIDENCE_MEDIUM = 0.7;
export const CONFIDENCE_LOW = 0.5;

/** Model tier ordering from cheapest to most expensive */
export const MODEL_TIERS = ["haiku", "sonnet", "opus"] as const;
