---
name: landing-page-optimizer
description: Run hypothesis-driven A/B tests on the landing page, measure conversion improvements via PostHog feature flags, and report outcomes with statistical significance. Use when optimizing landing page conversion, testing CTA changes, running experiments on page elements, or analyzing funnel drop-offs.
---

# Landing Page Optimizer

Iterate on the landing page using a data-driven, hypothesis-driven approach. Each change proposes a specific hypothesis, implements it as an A/B test, and measures results with actual numbers.

## Experiment Workflow

1. Read current landing page conversion metrics from PostHog via the API.
2. Identify the lowest-performing element or step in the conversion funnel.
3. Generate a hypothesis: specify the change, the expected impact, and the metric to measure. Example: "Changing CTA from 'Get Started' to 'Start Free Trial' should increase signup conversion by 5%."
4. Implement the change as a feature flag variant in PostHog for A/B testing.
5. Run the experiment until the sample size reaches statistical significance -- do not draw conclusions early.
6. Compare control vs variant conversion rates and determine a winner.
7. Accept or reject the hypothesis based on measured data.

## Recording and Reporting

- Log every experiment result to `.harness/experiments.yml`: hypothesis, variant, sample size, outcome.
- Promote winning variants to the default experience. Roll back losing variants.
- Report winners in investor updates: "Changed X from A to B -- conversion increased from N% to M% (+P%)".
- Track cumulative conversion improvement over time across all experiments.

## Constraints

- Isolate one variable per experiment -- never change multiple elements simultaneously.
- Only one experiment per page at a time to avoid interaction effects.
- Every hypothesis must specify a measurable metric -- "make it look better" is not valid.
