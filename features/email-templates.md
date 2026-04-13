# email-templates

**Status:** 🔴 Not started
**Agent:** website-dev
**Category:** coding
**Created:** 2026-04-13

## Description

Transactional email templates for the startup: welcome, password reset, billing, and notification emails. Designed to match the Figma brand guidelines. Built with React Email or similar. Tested with preview renders.

## Checklist

- [ ] React Email (or similar) integrated into the project
- [ ] Welcome email template — sent on sign up
- [ ] Password reset email template
- [ ] Billing/receipt email template
- [ ] Notification email templates (e.g., new activity, weekly digest)
- [ ] All templates match brand guidelines (colors, typography, logo)
- [ ] Responsive design — renders correctly on mobile and desktop email clients
- [ ] Preview renders generated for visual QA
- [ ] Email sending service configured (e.g., Resend, SendGrid, Postmark)
- [ ] Templates tested across major email clients (Gmail, Outlook, Apple Mail)
- [ ] Unsubscribe link included in marketing emails
- [ ] Plain text fallback for every HTML email

## Notes

- React Email provides a component-based approach that works well with the existing React stack
- Brand guidelines from .harness/brand.yml should be referenced for colors and typography
- Preview renders can be generated in CI to catch visual regressions
