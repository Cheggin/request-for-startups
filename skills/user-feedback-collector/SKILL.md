---
name: user-feedback-collector
description: Build an in-app feedback widget that collects user feedback, categorizes it by type (bug, feature request, general), routes it to appropriate agents, and converts feature requests into GitHub Issues. Use when adding feedback collection, building feedback widgets, setting up user feedback routing, or aggregating feedback trends.
user-invocable: true
group: grow
prerequisites: [website-creation]
next: [github-state-manager]
workflows: [full-startup]
---

# User Feedback Collector

Build a lightweight, non-disruptive in-app feedback widget accessible from every page that collects, categorizes, and routes user feedback.

## Widget Implementation

1. Create a feedback form component capturing: type (bug, feature request, general), message, and optional screenshot via `html2canvas` or similar browser API.
2. Store submissions in the database with user context: current page URL, browser info, user ID, timestamp.
3. Send an acknowledgment to the user on submission.

## Routing Logic

Route feedback by type to the appropriate handler:
- **Bug reports** -> coding agent for resolution
- **Feature requests** -> product team; auto-create GitHub Issues with appropriate labels
- **General feedback** -> growth agent for trend analysis

## Aggregation and Analysis

1. Implement duplicate detection to group similar feedback items together.
2. Add sentiment analysis to flag urgent negative experiences for immediate attention.
3. Build a feedback dashboard for reviewing and triaging submissions.
4. Aggregate trends (most requested features, common complaints) for investor update reports.

## Constraints

- The widget must be non-disruptive -- no popups or modals on page load.
- Feedback must be explicitly submitted by users, not inferred.
- This is a lightweight collector, not a full helpdesk or ticketing system.
