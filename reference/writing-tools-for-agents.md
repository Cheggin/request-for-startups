# Writing Effective Tools for Agents — With Agents

**Source:** https://www.anthropic.com/engineering/writing-tools-for-agents
**Published:** September 11, 2025

## Introduction

This article explores how to design high-quality tools for AI agents using the Model Context Protocol (MCP). The core thesis: "agents are only as effective as the tools we give them."

## Core Workflow: Three Steps

The post outlines a systematic approach:

1. **Build prototypes** - Stand up quick tool implementations using Claude Code with relevant documentation (SDKs, APIs)
2. **Run evaluations** - Measure how well Claude uses tools through programmatic testing with real-world task scenarios
3. **Iterate with agents** - Use Claude itself to analyze evaluation transcripts and optimize tool implementations

## Key Principles for Tool Design

### Choosing the Right Tools
Not all tools improve performance. Rather than wrapping every API endpoint, focus on "tools that match evaluation tasks and scaling up from there." The article uses an address book analogy: implement `search_contacts` rather than `list_contacts` since agents have limited context.

### Namespacing
Group related tools with consistent prefixes (e.g., `asana_search`, `asana_projects_search`) to help agents "select the right tools at the right time."

### Returning Meaningful Context
Avoid low-level technical identifiers like UUIDs. Instead, return semantic information using fields like `name` and `file_type`. The article suggests offering a `response_format` parameter allowing agents to request "concise" or "detailed" responses.

### Token Efficiency
Implement "pagination, range selection, filtering, and/or truncation" with sensible defaults. Claude Code restricts tool responses to 25,000 tokens by default.

### Prompt Engineering
"Small refinements to tool descriptions can yield dramatic improvements." Include clear parameter names, expected inputs/outputs, and helpful error messages that guide agents toward token-efficient behaviors.

## Evaluation Best Practices

Strong evaluation tasks involve multiple steps and real-world complexity—"potentially dozens" of tool calls. The article contrasts weak tasks ("Search the payment logs for `purchase_complete`") with strong ones requiring multi-step reasoning and context assembly.

Use metrics beyond accuracy: track runtime, token consumption, error rates, and tool-calling patterns to identify optimization opportunities.

## Results

Internal testing showed significant performance gains when using Claude to optimize tools. Graphs demonstrate improved accuracy on held-out test sets for both Slack and Asana MCP implementations compared to manually written versions.
