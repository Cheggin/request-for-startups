---
name: legal-generator
description: Generate Terms of Service, Privacy Policy, and Cookie Policy from startup type and jurisdiction. Use before any public launch. Produces legally-aware templates that cover standard requirements (GDPR, CCPA, SOC2 basics) without being actual legal advice.
---

# Legal Page Generator

Generate standard legal pages from startup context. These are templates — always recommend the founder get real legal review before launch.

## Pages Generated

1. **Terms of Service** — user agreement, acceptable use, limitation of liability
2. **Privacy Policy** — data collection, storage, sharing, user rights (GDPR/CCPA aware)
3. **Cookie Policy** — what cookies are used, consent mechanism

## Steps

1. Read .harness/founder-profile.yml for startup type and jurisdiction
2. Determine applicable regulations:
   - B2C with EU users → GDPR (data deletion, export, consent)
   - B2C with California users → CCPA (opt-out, disclosure)
   - Fintech → additional financial disclosures
   - Healthcare → HIPAA notice
   - Children's data → COPPA
3. Generate each page as a Next.js page component at app/legal/
4. Include last-updated date
5. Link from footer on every page

## Anti-Patterns

- Copying another company's legal pages verbatim
- Claiming compliance without implementing the actual mechanisms (e.g., "GDPR compliant" without data export)
- Omitting cookie consent for EU users
- Using legal jargon without plain-language summaries
