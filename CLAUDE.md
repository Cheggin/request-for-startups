# Project Rules

## Skill Invocation — Slash Commands Only

Agents MUST invoke skills via their slash command (e.g., `/startup-harness:startup-init`). Never interpret a skill name as a description of what to build and improvise the implementation. The skill contains phase-by-phase instructions that get completely bypassed when an agent freestyles.

- Type the slash command and press Enter — do not paraphrase, summarize, or re-implement what the skill does.
- Every phase defined in the skill (interview, research, spec, design, build, deploy, growth) must execute in order. No phase may be skipped.
- If a prompt says "run startup-init" or "run competitor-research", that means invoke `/startup-harness:startup-init` or `/startup-harness:competitor-research` — not "build a startup" or "research competitors" freestyle.
