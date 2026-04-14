# adaptive-agent-loadout

**Status:** 🟢 Complete
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

The agent skill loadout should adapt based on what kind of startup is being built. A B2C consumer app needs different skills than a devtool or B2B SaaS. The system should detect the startup type from the product spec and load the right skills per agent automatically.

## Startup Types

| Type | Detection signals | Key differences |
|------|------------------|-----------------|
| B2C consumer | "app", "users", "mobile", "social" | Viral loops, app store, onboarding UX, social media marketing |
| DevTool | "API", "SDK", "CLI", "developer", "integration" | Docs site, playground, npm/PyPI, developer advocacy |
| B2B SaaS | "enterprise", "teams", "dashboard", "billing" | Admin panel, integrations, case studies, sales enablement |
| Marketplace | "buyers", "sellers", "listing", "matching" | Two-sided onboarding, trust/safety, payments escrow |
| Content/Media | "content", "publish", "subscribe", "feed" | CMS, content pipeline, recommendation engine |

## Checklist

- [ ] Product type classifier — analyze spec and categorize startup
- [ ] Per-type skill manifest — which skills each agent loads per startup type
- [ ] Per-type template selection — different website templates per type
- [ ] Per-type growth strategy — different growth skills per type
- [ ] Per-type content strategy — different content skills per type
- [ ] Fallback to generic if type is ambiguous
- [ ] Type stored in .harness/project.yml alongside stacks.yml
- [ ] Agents can query project type to adjust behavior

## Notes

- This is about skill SELECTION, not skill creation — skills exist, the system picks which to load
- The commander decides which agents to spawn based on project type
- Some agents are universal (ops, website basics), others are type-specific (docs agent only for devtools)
