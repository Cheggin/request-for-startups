# Code Execution with MCP: Building More Efficient Agents

**Source:** https://www.anthropic.com/engineering/code-execution-with-mcp

## Overview

This article explores how code execution can enable AI agents to interact with Model Context Protocol (MCP) servers more efficiently. The key insight is that agents should write code to call tools rather than using direct tool calls, significantly reducing token consumption.

## Main Problems Addressed

### 1. Tool Definitions Overload Context
Loading all tool definitions upfront consumes excessive tokens. When agents connect to thousands of tools, they process "hundreds of thousands of tokens before reading a request."

### 2. Intermediate Results Consume Additional Tokens
When agents call tools directly, every result passes through the model context. The example given shows a transcript flowing through context twice—potentially consuming an extra 50,000 tokens for a 2-hour meeting.

## Proposed Solution: Code APIs Instead of Direct Calls

Rather than exposing tools via direct tool-calling syntax, present MCP servers as code APIs. Agents then write code to interact with them.

### Implementation Approach

Create a filesystem structure where each tool corresponds to a file:

```
servers/
├── google-drive/
│   ├── getDocument.ts
│   └── ...
├── salesforce/
│   ├── updateRecord.ts
│   └── ...
```

Agents discover available tools by exploring the filesystem, loading only what they need. This reduces token usage "from 150,000 tokens to 2,000 tokens—a time and cost saving of 98.7%."

## Key Benefits

**Progressive Disclosure**: Models navigate filesystems effectively, reading tool definitions on-demand rather than upfront.

**Context-Efficient Results**: Large datasets can be filtered in code before returning to the model. Instead of processing 10,000 spreadsheet rows in context, filter to relevant data.

**Control Flow**: Loops, conditionals, and error handling execute in code rather than requiring repeated tool calls, reducing latency.

**Privacy-Preserving Operations**: Intermediate results stay in the execution environment. Sensitive data can be tokenized automatically, flowing between systems without entering the model.

**State Persistence**: Agents maintain state across operations using filesystem access, enabling resumption and progress tracking.

**Reusable Skills**: Agents can save working code as functions for future reuse, building a toolkit of higher-level capabilities.

## Important Caveats

Code execution introduces complexity. Secure execution requires proper "sandboxing, resource limits, and monitoring." These infrastructure requirements add operational overhead compared to direct tool calls, requiring careful cost-benefit analysis.

## Conclusion

MCP enables agents to connect to many tools, but excessive tool definitions and intermediate results create inefficiency. Code execution applies established software engineering patterns to agents, allowing them to interact with MCP servers more efficiently using familiar programming constructs.
