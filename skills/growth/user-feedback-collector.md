# user-feedback-collector

**Status:** 🔴 Not started
**Agent:** growth
**Category:** growth
**Created:** 2026-04-13

## Description

In-app feedback widget that collects user feedback and routes it to the appropriate agent. The growth agent analyzes feedback for trends. Feature requests are automatically converted into GitHub Issues.

## Checklist

- [ ] In-app feedback widget — accessible from every page
- [ ] Feedback form captures: type (bug, feature request, general), message, screenshot option
- [ ] Feedback stored in the database with user context (page, browser, user ID)
- [ ] Routing logic — bugs go to coding agent, feature requests to product, general to growth
- [ ] Feature requests automatically created as GitHub Issues with appropriate labels
- [ ] Growth agent aggregates feedback for trend analysis (most requested features, common complaints)
- [ ] Feedback trends reported in investor updates
- [ ] User receives acknowledgment when feedback is submitted
- [ ] Feedback dashboard for reviewing and triaging submissions
- [ ] Duplicate detection — group similar feedback items together
- [ ] Sentiment analysis on feedback to flag urgent negative experiences

## Notes

- The feedback widget should be lightweight and not disrupt the user experience
- Screenshot capture can use html2canvas or similar browser API
- Feedback routing uses the agent-categories system defined in .harness/agent-categories.yml
