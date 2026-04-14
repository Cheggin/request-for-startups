# Plan: Stack-Extend Skill + Stripe/Auth/Email Templates

## Task 1: skills/shared/stack-extend.md
- SKILL.md format matching existing skills (YAML frontmatter + steps)
- Reads tool-catalog.yml, installs packages, updates stacks.yml/.env
- Handles catalog hits and misses (WebSearch fallback)
- Creates GitHub Issue, posts investor update

## Task 2: templates/stripe/
- checkout.tsx (Embedded Checkout + Server Actions)
- webhook-handler.ts (Next.js API route, 4 event types)
- pricing.tsx (tier cards with monthly/annual toggle)
- subscription-status.ts (Convex function)
- constants.ts (price IDs, plan names, features)
- README.md (setup instructions)

## Task 3: templates/auth/ (Clerk)
- middleware.ts, provider.tsx, sign-in.tsx, sign-up.tsx, user-button.tsx, README.md

## Task 4: templates/email/ (Resend + React Email)
- send.ts, templates/welcome.tsx, templates/reset-password.tsx, README.md

## Tests
- tests/stack-extend.test.ts (catalog lookup, stacks.yml modification)

## Commits
- One commit per task, push to main, no co-author
