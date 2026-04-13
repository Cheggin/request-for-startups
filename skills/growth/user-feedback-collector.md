---
name: user-feedback-collector
description: In-app feedback widget that collects user feedback, routes it to agents, and converts feature requests into GitHub Issues
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

# User Feedback Collector

## Purpose

Build an in-app feedback widget that collects user feedback from every page, categorizes it by type (bug, feature request, general), and routes it to the appropriate agent. Feature requests are automatically converted into GitHub Issues. The growth agent aggregates feedback for trend analysis and reports findings in investor updates.

## Steps

1. Create a lightweight in-app feedback widget component accessible from every page.
2. Build a feedback form that captures: type (bug, feature request, general), message, and optional screenshot.
3. Implement screenshot capture using html2canvas or a similar browser API.
4. Store feedback submissions in the database with user context (current page, browser info, user ID).
5. Implement routing logic: bugs go to the coding agent, feature requests to product, general feedback to growth.
6. Automatically create GitHub Issues from feature requests with appropriate labels.
7. Send an acknowledgment to the user when feedback is submitted.
8. Build a feedback dashboard for reviewing and triaging submissions.
9. Implement duplicate detection to group similar feedback items together.
10. Add sentiment analysis to flag urgent negative experiences.
11. Aggregate feedback trends (most requested features, common complaints) for the growth agent.
12. Include feedback trend summaries in investor updates.

## Examples

Good:
- "Add a feedback widget to the app that lets users report bugs and request features"
- "Set up automatic GitHub Issue creation from user feature requests"
- "Build a feedback dashboard showing the top 10 most requested features this month"

Bad:
- "Read user minds to know what they want" (feedback must be explicitly submitted by users)
- "Add a popup on every page asking for feedback" (widget must be non-disruptive)
- "Build a full customer support ticketing system" (this is a lightweight feedback collector, not a helpdesk)

## Checklist

- [ ] In-app feedback widget accessible from every page
- [ ] Feedback form captures type (bug, feature request, general), message, and screenshot option
- [ ] Feedback stored in the database with user context (page, browser, user ID)
- [ ] Routing logic sends bugs to coding agent, feature requests to product, general to growth
- [ ] Feature requests automatically created as GitHub Issues with appropriate labels
- [ ] Growth agent aggregates feedback for trend analysis
- [ ] Feedback trends reported in investor updates
- [ ] User receives acknowledgment when feedback is submitted
- [ ] Feedback dashboard for reviewing and triaging submissions
- [ ] Duplicate detection groups similar feedback items together
- [ ] Sentiment analysis flags urgent negative experiences
