# landing-page-optimizer

**Status:** 🔴 Not started
**Agent:** growth
**Category:** growth
**Created:** 2026-04-13

## Description

Growth agent iterates on the landing page based on analytics data. Each change is hypothesis-driven: "changing CTA from X to Y should increase conversion by Z%." Results are measured via PostHog and reported in investor updates with actual numbers.

## Checklist

- [ ] Growth agent reads current landing page conversion metrics from PostHog
- [ ] Hypothesis generation — propose a specific change with expected impact
- [ ] Implement the change as a feature flag / A/B test variant
- [ ] Run experiment for statistically significant sample size
- [ ] Measure results — compare control vs. variant conversion rates
- [ ] Accept or reject hypothesis based on data
- [ ] Log experiment results (hypothesis, variant, sample size, outcome) to .harness/experiments.yml
- [ ] Report winning experiments in investor updates with actual numbers
- [ ] Roll back losing variants automatically
- [ ] Promote winning variants to the default experience
- [ ] Track cumulative conversion improvement over time

## Notes

- Requires analytics-integration feature to be complete first
- Each experiment should change one variable at a time for clean measurement
- Growth agent should not ship more than one experiment per page simultaneously
- Investor update format: "Changed CTA from 'Get Started' to 'Start Free Trial' — conversion increased from 2.1% to 3.4% (+62%)"
