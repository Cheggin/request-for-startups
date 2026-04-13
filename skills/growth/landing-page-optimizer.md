---
name: landing-page-optimizer
description: Run hypothesis-driven A/B tests on the landing page and measure conversion improvements via PostHog
category: growth
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebFetch
---

# Landing Page Optimizer

## Purpose

Iterate on the landing page using a data-driven, hypothesis-driven approach. Each change proposes a specific hypothesis ("changing CTA from X to Y should increase conversion by Z%"), implements it as an A/B test via PostHog feature flags, measures results with statistical significance, and reports outcomes with actual numbers in investor updates.

## Steps

1. Read current landing page conversion metrics from PostHog via the API.
2. Identify the lowest-performing element or step in the conversion funnel.
3. Generate a hypothesis: specify the change, the expected impact, and the metric to measure.
4. Implement the change as a feature flag variant in PostHog for A/B testing.
5. Run the experiment until the sample size reaches statistical significance.
6. Compare control vs variant conversion rates and determine a winner.
7. Accept or reject the hypothesis based on the measured data.
8. Log the experiment result (hypothesis, variant, sample size, outcome) to `.harness/experiments.yml`.
9. Promote winning variants to the default experience and roll back losing variants.
10. Report winning experiments in investor updates with the format: "Changed X from A to B -- conversion increased from N% to M% (+P%)".
11. Track cumulative conversion improvement over time across all experiments.

## Examples

Good:
- "Test changing the CTA button text from 'Get Started' to 'Start Free Trial' and measure signup conversion"
- "Run an A/B test on the hero headline to improve visitor-to-signup conversion rate"
- "Analyze the current funnel drop-off and propose a hypothesis to improve the weakest step"

Bad:
- "Redesign the entire landing page" (changes must be isolated to one variable per experiment)
- "Make the landing page look better" (too vague; needs a specific hypothesis with a measurable metric)
- "Run 5 experiments at once on the same page" (only one experiment per page at a time)

## Checklist

- [ ] Growth agent reads current landing page conversion metrics from PostHog
- [ ] Hypothesis generated with specific change and expected impact
- [ ] Change implemented as a feature flag or A/B test variant
- [ ] Experiment runs for statistically significant sample size
- [ ] Results measured comparing control vs variant conversion rates
- [ ] Hypothesis accepted or rejected based on data
- [ ] Experiment results logged to .harness/experiments.yml
- [ ] Winning experiments reported in investor updates with actual numbers
- [ ] Losing variants rolled back automatically
- [ ] Winning variants promoted to default experience
- [ ] Cumulative conversion improvement tracked over time
