# billing-template

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Stripe billing integration template for harness-built startups: pricing page, checkout flow, subscription management, usage tracking, and invoices. Activated when the startup idea requires monetization. Includes a Stripe webhook handler for event processing.

## Checklist

- [ ] Pricing page — display plans with feature comparison, monthly/annual toggle
- [ ] Stripe Checkout integration — redirect to Stripe-hosted checkout
- [ ] Subscription management — upgrade, downgrade, cancel from user dashboard
- [ ] Usage tracking — meter usage for usage-based billing models
- [ ] Invoice history — display past invoices with download links
- [ ] Stripe webhook handler — process checkout.session.completed, invoice.paid, subscription.updated, etc.
- [ ] Webhook signature verification — validate Stripe webhook signatures
- [ ] Convex schema for subscriptions — user-to-subscription mapping, plan details, billing status
- [ ] Free trial support — configurable trial period before first charge
- [ ] Dunning management — handle failed payments, send retry notifications
- [ ] Pricing plan configuration — define plans in a config file, not hardcoded
- [ ] Activation toggle — feature flag to enable billing when monetization is needed
- [ ] Unit tests for webhook handling, subscription state transitions, and pricing logic

## Notes

- Billing is only activated when the startup idea explicitly requires monetization
- Uses Stripe Checkout for PCI compliance — never handle raw card data
- Webhook handler must be idempotent — Stripe can send duplicate events
- Pricing plans should be defined in a config file so they can change without code deploys
- The billing template assumes auth-flow-template is already enabled
