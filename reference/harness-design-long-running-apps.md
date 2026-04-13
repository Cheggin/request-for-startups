# Harness Design for Long-Running Application Development

**Source:** https://www.anthropic.com/engineering/harness-design-long-running-apps
**Published:** March 24, 2026
**Author:** Prithvi Rajasekaran, Anthropic Labs

## Overview

This article explores how multi-agent architectures inspired by Generative Adversarial Networks (GANs) can improve Claude's performance on complex, long-running tasks. The work demonstrates significant quality improvements in both frontend design and full-stack application development.

## Key Problems with Naive Implementations

### Context Management Issues

Models struggle with lengthy tasks as context windows fill. Claude Sonnet 4.5 exhibited "context anxiety"—prematurely wrapping up work as it approached perceived context limits. The solution involves context resets rather than compaction, providing agents with clean slates while using structured handoffs to maintain state.

### Self-Evaluation Limitations

Agents tend to praise their own work overly generously, particularly on subjective tasks. "Separating the agent doing the work from the agent judging it proves to be a strong lever" to address this bias. Tuning a standalone evaluator to be skeptical is more tractable than making generators self-critical.

## Frontend Design Approach

Four grading criteria guided the generator-evaluator loop:

- **Design Quality:** Coherent aesthetic identity combining colors, typography, layout, and imagery
- **Originality:** Custom decisions versus generic AI patterns
- **Craft:** Technical execution—typography, spacing, color harmony, contrast
- **Functionality:** Usability and task completion

The evaluator used the Playwright MCP to navigate live pages before scoring. Iterations ranged from 5-15 cycles, with some redesigns pivoting entirely between iterations based on feedback.

## Full-Stack Coding Architecture

### Three-Agent System

**Planner:** Expands brief 1-4 sentence prompts into comprehensive product specs, staying focused on deliverables rather than implementation details. It identifies opportunities to integrate AI features.

**Generator:** Works in sprints using React, Vite, FastAPI, and SQLite/PostgreSQL stacks. Self-evaluates before handing off to QA with git version control.

**Evaluator:** Uses Playwright MCP to test applications like actual users would. Before each sprint, generator and evaluator negotiate a "sprint contract" defining success criteria. The evaluator probes edge cases and files specific bugs against contract violations.

## Case Studies

### Retro Game Maker (Opus 4.5)

**Solo Run:** 20 minutes, $9
- Functional UI with broken core gameplay
- Rigid workflows requiring users to guess at sequences
- Entity-to-runtime wiring failed silently

**Full Harness:** 6 hours, $200
- 10-sprint spec with 16 features
- Functioning sprite editor, level editor, and playable mode
- AI-assisted sprite and level generation
- Coherent visual design language

The quality difference was "immediately apparent" upon testing.

### Digital Audio Workstation (Opus 4.6)

**Total Duration:** 3 hours 50 minutes
**Total Cost:** $124.70

With Opus 4.6's improvements in planning, long-context reasoning, and code review, the harness eliminated sprint decomposition while maintaining quality. The QA agent caught critical gaps on first pass:

- Missing interactive timeline features (drag, resize, split clips)
- Stub-only audio recording
- Lack of graphical effect visualizations

The resulting DAW included functional arrangement views, mixer, transport controls, and agent-driven composition through tool use.

## Iterative Harness Simplification

As models improve, harnesses should be continuously re-examined. The principle: "find the simplest solution possible, and only increase complexity when needed."

With Opus 4.6, several assumptions became outdated:
- Sprint structures became less critical for coherent long-context work
- Single-pass evaluation replaced per-sprint QA for some tasks
- Better native planning reduced need for separate planner agents

However, task complexity still determines evaluator necessity. The evaluator adds measurable value when tasks sit at the edge of what models handle reliably solo.

## Key Learnings

1. **Decomposition works:** Breaking complex tasks into specialized agent roles improves performance
2. **Structured handoffs matter:** Using files and contracts enables multi-agent coherence
3. **External evaluation is powerful:** Separating generation from evaluation enables better feedback loops
4. **Harness tuning is continuous:** Each new model release requires reassessing which components remain load-bearing
5. **Criteria shape outputs:** The language used in evaluation criteria directly influences generator behavior, often in unexpected ways

## Conclusion

The article argues that harness design space expands rather than shrinks as models improve. Better models don't eliminate the need for specialized orchestration—they shift where that orchestration provides value. "The interesting work for AI engineers is to keep finding the next novel combination" as capabilities evolve.
