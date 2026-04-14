# PulseCheck — Product Spec

**Product:** B2B SaaS for weekly team pulse surveys, anonymous feedback, and trend analytics
**Date:** 2026-04-14
**Status:** Draft

---

## 1. Problem

Managers lack a lightweight, recurring way to gauge team health. Existing tools (Lattice, Culture Amp, 15Five) are bloated, expensive, and optimized for HR — not frontline managers who just want to know how their team is doing this week. Teams skip surveys because they're too long, responses aren't anonymous, and managers never act on the data because it's buried in spreadsheets.

## 2. Solution

A focused tool that does one thing well: weekly pulse surveys with anonymous responses and trend visualization. Managers create short surveys (1–5 rating + open text), send them via email, and see results on a dashboard with week-over-week trends. No performance reviews, no OKRs, no 360 feedback — just a pulse.

| Surface | Description |
|---------|------------|
| Web app (Next.js 15) | Dashboard, survey builder, team management, trend charts |
| Email (Resend) | Survey delivery, reminders, digest notifications |

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS v4 |
| Database / Backend | Convex |
| Email | Resend |
| Auth | Convex Auth (email magic link) |
| Charts | Recharts |
| Font | Geist Sans (UI), Geist Mono (data) |
| Deployment | Vercel |

No Inter font.

---

## 4. Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Landing | No | Hero, features, pricing preview, CTA |
| `/login` | Login | No | Email magic link sign-in |
| `/signup` | Signup | No | Create account + first team |
| `/dashboard` | Dashboard | Yes | Response charts, recent surveys, team health score |
| `/dashboard/surveys` | Survey list | Yes | All surveys with status (draft, active, closed) |
| `/dashboard/surveys/new` | Survey builder | Yes | Create a new pulse survey |
| `/dashboard/surveys/[id]` | Survey detail | Yes | Results for a specific survey — charts + open text responses |
| `/dashboard/surveys/[id]/edit` | Edit survey | Yes | Modify a draft survey |
| `/dashboard/trends` | Trends | Yes | Week-over-week and question-level trend lines |
| `/dashboard/team` | Team management | Yes | Add/remove members, roles, invite status |
| `/dashboard/settings` | Settings | Yes | Account, notification preferences, billing |
| `/respond/[token]` | Survey response | No | Anonymous response form (accessed via email link) |
| `/respond/[token]/thanks` | Thank you | No | Confirmation after submitting a response |

---

## 5. Features — Prioritized

### P0 — Must Ship (MVP)

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| P0-1 | **Email magic link auth** | Entering a valid email on `/login` sends a magic link via Resend. Clicking the link creates a session. Session persists across page reloads. Invalid/expired links show an error message. |
| P0-2 | **Create team** | On first login, user is prompted to name their team. Team is created with the user as owner. User is redirected to `/dashboard`. Team name appears in the sidebar. |
| P0-3 | **Invite team members** | On `/dashboard/team`, owner can enter email addresses to invite. Each invite sends an email via Resend with a join link. Invited members appear in the list with "pending" status. Accepting the invite changes status to "active". |
| P0-4 | **Survey builder** | On `/dashboard/surveys/new`, user can add questions of two types: rating (1–5 scale) and open text. User can reorder questions via drag-and-drop. User can set a survey title. Minimum 1 question required. Clicking "Send" delivers the survey to all active team members. |
| P0-5 | **Survey email delivery** | When a survey is sent, each active team member receives an email via Resend containing the survey title, question count, and a unique response link (`/respond/[token]`). Email renders correctly in Gmail, Outlook, and Apple Mail. |
| P0-6 | **Anonymous response submission** | Visiting `/respond/[token]` shows the survey questions. Rating questions display 1–5 buttons. Open text questions display a textarea. Submitting the form records the response. The response is not linked to the respondent's identity in any queryable way. Submitting twice with the same token shows "already submitted". |
| P0-7 | **Survey results view** | On `/dashboard/surveys/[id]`, the owner sees: response rate (X/Y responded), average rating per rating question (bar chart), and a list of open text responses (no attribution). Results update in real-time as responses come in (Convex reactivity). |
| P0-8 | **Dashboard overview** | `/dashboard` shows: number of active team members, latest survey with response rate, average rating across all rating questions from the most recent survey, and a sparkline of average ratings over the last 8 weeks. |
| P0-9 | **Survey lifecycle** | A survey has three states: `draft` (editable, not sent), `active` (sent, accepting responses), `closed` (no longer accepting responses). Surveys auto-close after 7 days. Owner can manually close an active survey. Responding to a closed survey shows "This survey has closed". |
| P0-10 | **Responsive layout** | All authenticated pages use a sidebar layout on desktop (>1024px) and a bottom nav on mobile. Survey response pages (`/respond/*`) are single-column and mobile-optimized. |

### P1 — Should Ship (v1.0)

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| P1-1 | **Trend charts** | `/dashboard/trends` shows a line chart of average rating per question over the last 12 weeks. User can filter by specific question. Weeks with no survey show a gap in the line. |
| P1-2 | **Survey templates** | When creating a survey, user can choose from 3 built-in templates: "Weekly Pulse" (5 questions), "Sprint Retro" (4 questions), "Team Morale" (3 questions). Templates pre-fill questions that the user can edit before sending. |
| P1-3 | **Email reminders** | If a team member hasn't responded after 48 hours, they receive a reminder email. Only one reminder per survey. Reminder includes original response link. |
| P1-4 | **Recurring surveys** | Owner can set a survey to repeat weekly on a chosen day. Each week, a new survey instance is created and sent automatically. Owner can pause or stop the recurrence. |
| P1-5 | **Response rate alerts** | If response rate drops below 50% at the 48-hour mark, the owner receives an email notification. Alert includes a link to the survey results page. |
| P1-6 | **CSV export** | On the survey detail page, owner can click "Export CSV" to download a file with columns: question text, response type, value (rating number or text), timestamp. No respondent identifiers in the export. |
| P1-7 | **Team roles** | Two roles: `owner` (full access) and `member` (responds to surveys only). Owner can promote a member to owner. At least one owner must exist at all times. |
| P1-8 | **Question bank** | Owner can save frequently used questions to a personal question bank. When building a survey, saved questions appear in a sidebar for quick insertion. |
| P1-9 | **Landing page** | `/` contains: hero with headline and CTA, 3-feature highlight (anonymous, trends, simple), screenshot of dashboard, pricing preview (free tier + paid tier), and footer. Lighthouse performance score >= 90. |
| P1-10 | **Dark mode** | Theme toggle in the sidebar. Persists preference in localStorage. Respects `prefers-color-scheme` on first visit. All pages render correctly in both modes. |

### P2 — Nice to Have (v1.x)

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| P2-1 | **Slack integration** | Owner can connect a Slack workspace. Survey notifications are sent to a chosen channel in addition to email. Responses still happen via web link. |
| P2-2 | **Sentiment analysis on open text** | Open text responses are tagged as positive, neutral, or negative. Survey detail page shows a sentiment breakdown pie chart. |
| P2-3 | **Benchmarking** | Dashboard shows how the team's average pulse score compares to anonymized aggregate across all PulseCheck teams of similar size. |
| P2-4 | **Multiple teams** | An owner can manage more than one team from a single account. Sidebar shows a team switcher dropdown. Each team has independent surveys, members, and trends. |
| P2-5 | **Custom branding** | Owner can upload a logo and set a primary color. These appear on the survey response page and in emails. |
| P2-6 | **Manager digest email** | Weekly email to the owner summarizing: response rate, top-rated question, lowest-rated question, notable open text excerpts, and trend direction (up/down/flat). |
| P2-7 | **Heatmap view** | `/dashboard/trends` includes a heatmap showing question ratings by week. Color scale from red (1.0) to green (5.0). |
| P2-8 | **Survey scheduling** | Owner can create a survey and schedule it to send at a future date/time. Scheduled surveys appear in the list with a "scheduled" badge. |
| P2-9 | **Anonymous thread replies** | Owner can reply to an open text response. The respondent receives the reply via email without the owner learning who they are (Convex mediates the exchange). |
| P2-10 | **Billing / paid tier** | Stripe integration. Free tier: 1 team, 5 members, 4 surveys/month. Pro ($12/team/month): unlimited members, unlimited surveys, CSV export, recurring surveys. |

---

## 6. Data Model (Convex Schema)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ───────────────────────────────────────────
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(), // epoch ms
  }).index("by_email", ["email"]),

  // ─── Auth Sessions ──────────────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // ─── Teams ──────────────────────────────────────────
  teams: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  // ─── Team Memberships ──────────────────────────────
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.optional(v.id("users")), // null until invite is accepted
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    status: v.union(v.literal("pending"), v.literal("active")),
    inviteToken: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    invitedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_invite_token", ["inviteToken"])
    .index("by_team_email", ["teamId", "email"]),

  // ─── Surveys ────────────────────────────────────────
  surveys: defineTable({
    teamId: v.id("teams"),
    createdBy: v.id("users"),
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("closed")
    ),
    questions: v.array(
      v.object({
        id: v.string(), // nanoid
        type: v.union(v.literal("rating"), v.literal("text")),
        text: v.string(),
        order: v.number(),
      })
    ),
    sentAt: v.optional(v.number()),
    closesAt: v.optional(v.number()), // auto-close timestamp
    isRecurring: v.optional(v.boolean()),
    recurringDay: v.optional(v.number()), // 0=Sun, 1=Mon, ...
    parentSurveyId: v.optional(v.id("surveys")), // for recurring instances
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_closes_at", ["closesAt"]),

  // ─── Response Tokens ────────────────────────────────
  // Maps a unique token to a survey + team member for response tracking.
  // The response itself does NOT reference this token — preserving anonymity.
  responseTokens: defineTable({
    surveyId: v.id("surveys"),
    teamMemberId: v.id("teamMembers"),
    token: v.string(), // unique URL-safe token
    used: v.boolean(),
    reminderSentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_survey", ["surveyId"])
    .index("by_survey_member", ["surveyId", "teamMemberId"]),

  // ─── Responses ──────────────────────────────────────
  // Intentionally has NO reference to user or teamMember.
  // Anonymity is structural, not policy-based.
  responses: defineTable({
    surveyId: v.id("surveys"),
    answers: v.array(
      v.object({
        questionId: v.string(),
        rating: v.optional(v.number()), // 1–5 for rating questions
        text: v.optional(v.string()), // for text questions
      })
    ),
    submittedAt: v.number(),
  }).index("by_survey", ["surveyId"]),

  // ─── Question Bank ──────────────────────────────────
  savedQuestions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("rating"), v.literal("text")),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─── Survey Templates ───────────────────────────────
  surveyTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    questions: v.array(
      v.object({
        type: v.union(v.literal("rating"), v.literal("text")),
        text: v.string(),
        order: v.number(),
      })
    ),
    isBuiltIn: v.boolean(),
    createdBy: v.optional(v.id("users")),
  }),
});
```

### Anonymity Design

The `responses` table has no foreign key to `users` or `teamMembers`. The `responseTokens` table tracks *who was invited* and *whether they responded* (for response rate calculation and reminders), but the actual response record is decoupled. This means:

- Managers can see response rates (X of Y responded)
- Managers cannot see who gave which answers
- Even a database query cannot join a response to a respondent
- The token is marked `used: true` when a response is submitted, but the response row does not store the token

---

## 7. Component Inventory

### 7.1 Layout / Shared

| Component | File | Description |
|-----------|------|-------------|
| `RootLayout` | `app/layout.tsx` | HTML shell, Geist Sans + Geist Mono fonts, Convex provider, metadata |
| `AuthLayout` | `app/(auth)/layout.tsx` | Centered card layout for login/signup |
| `DashboardLayout` | `app/dashboard/layout.tsx` | Sidebar + topbar + content area |
| `Sidebar` | `components/sidebar.tsx` | Nav links, team name, user avatar, theme toggle |
| `MobileNav` | `components/mobile-nav.tsx` | Bottom tab bar for mobile dashboard views |
| `TopBar` | `components/top-bar.tsx` | Page title, breadcrumbs, action buttons |
| `ThemeToggle` | `components/theme-toggle.tsx` | Light/dark switch |

### 7.2 Landing Page

| Component | Description |
|-----------|-------------|
| `Hero` | Headline, subhead, CTA button to `/signup` |
| `FeatureHighlights` | 3-column grid: anonymous, trends, simple |
| `DashboardPreview` | Screenshot/mockup of dashboard with annotation callouts |
| `PricingPreview` | Compact free-vs-pro comparison |
| `LandingFooter` | Links, copyright |

### 7.3 Auth

| Component | Description |
|-----------|-------------|
| `LoginForm` | Email input + "Send magic link" button + success state |
| `SignupForm` | Email input + team name input + submit |
| `MagicLinkSent` | Confirmation message with email + "check your inbox" |

### 7.4 Dashboard

| Component | Description |
|-----------|-------------|
| `HealthScore` | Large number showing team's average pulse rating this week |
| `ResponseRateCard` | Donut chart showing latest survey response rate |
| `RecentSurveyCard` | Card showing latest survey title, status, response count |
| `WeeklySparkline` | Small line chart of average ratings over last 8 weeks |
| `SurveyList` | Table of surveys with title, status badge, response rate, date, actions |
| `SurveyStatusBadge` | Colored badge: draft (gray), active (green), closed (slate) |

### 7.5 Survey Builder

| Component | Description |
|-----------|-------------|
| `SurveyBuilderForm` | Title input + question list + add question + send/save buttons |
| `QuestionCard` | Draggable card with question type, text input, delete button |
| `QuestionTypeSelector` | Toggle between "Rating (1–5)" and "Open Text" |
| `DragHandle` | Grip icon for reorder via drag-and-drop |
| `TemplateSelector` | Modal/dropdown to pick from built-in survey templates |
| `QuestionBankPanel` | Sidebar listing saved questions with "insert" buttons |
| `SendConfirmDialog` | Confirmation modal showing recipient count before sending |

### 7.6 Survey Results

| Component | Description |
|-----------|-------------|
| `ResponseRateBar` | Horizontal bar showing X/Y responded |
| `RatingChart` | Bar chart showing distribution of 1–5 ratings for a question |
| `AverageRatingDisplay` | Large number + label for a question's average |
| `OpenTextList` | List of anonymized open text responses |
| `SurveyResultsSummary` | Top-level stats: response rate, overall average, completion time |
| `ExportCSVButton` | Downloads results as CSV |

### 7.7 Trends

| Component | Description |
|-----------|-------------|
| `TrendLineChart` | Multi-line chart showing question averages over weeks |
| `QuestionFilter` | Dropdown to select which questions to show on the chart |
| `TrendSummaryCards` | Row of cards: highest trending, lowest trending, most stable |
| `HeatmapGrid` | Color-coded grid of questions (rows) x weeks (columns) |

### 7.8 Team Management

| Component | Description |
|-----------|-------------|
| `TeamMemberTable` | Table with name, email, role, status, actions |
| `InviteMemberForm` | Email input + "Send Invite" button |
| `RoleBadge` | Badge showing "Owner" or "Member" |
| `StatusBadge` | Badge showing "Active" or "Pending" |
| `RemoveMemberDialog` | Confirmation modal for removing a team member |
| `PromoteDialog` | Confirmation modal for promoting member to owner |

### 7.9 Survey Response (Public)

| Component | Description |
|-----------|-------------|
| `ResponseForm` | Survey title + list of question inputs + submit button |
| `RatingInput` | Row of 5 buttons (1–5) with selected state highlight |
| `TextInput` | Textarea with character count |
| `ResponseSubmitted` | Thank you message with team name |
| `SurveyClosedMessage` | Message explaining the survey is no longer accepting responses |

### 7.10 Settings

| Component | Description |
|-----------|-------------|
| `AccountSettings` | Name, email (read-only), avatar |
| `NotificationPreferences` | Toggle switches for email notification types |
| `TeamSettings` | Rename team, delete team (with confirmation) |
| `BillingSection` | Current plan, upgrade CTA, manage subscription link |

---

## 8. Convex Functions

### 8.1 Mutations

| Function | Description |
|----------|-------------|
| `users.create` | Create user from magic link auth |
| `teams.create` | Create team and add creator as owner |
| `teamMembers.invite` | Add pending member, generate invite token, trigger email |
| `teamMembers.acceptInvite` | Mark member active, link to user account |
| `teamMembers.remove` | Remove member from team |
| `teamMembers.updateRole` | Change member role (owner/member) |
| `surveys.create` | Create a draft survey with questions |
| `surveys.update` | Update a draft survey's title or questions |
| `surveys.send` | Set survey to active, generate response tokens, trigger emails |
| `surveys.close` | Set survey to closed |
| `responses.submit` | Validate token, mark token used, store anonymous response |
| `savedQuestions.save` | Add a question to the user's bank |
| `savedQuestions.delete` | Remove a question from the bank |

### 8.2 Queries

| Function | Description |
|----------|-------------|
| `surveys.list` | List surveys for a team, filterable by status |
| `surveys.get` | Get a single survey with question details |
| `surveys.getResults` | Get aggregated results: response rate, rating distributions, text responses |
| `responses.getBySurvey` | Get all responses for a survey (anonymous) |
| `teams.get` | Get team details |
| `teamMembers.list` | List all members of a team |
| `trends.getWeekly` | Get average ratings per question per week for the last N weeks |
| `dashboard.overview` | Get dashboard stats: member count, latest survey summary, sparkline data |
| `savedQuestions.list` | List user's saved questions |
| `responseTokens.getStatus` | Check if a response token is valid, used, or expired |

### 8.3 Actions (with side effects)

| Function | Description |
|----------|-------------|
| `email.sendSurveyInvite` | Send survey email via Resend |
| `email.sendReminder` | Send reminder email for unanswered surveys |
| `email.sendMagicLink` | Send auth magic link via Resend |
| `email.sendTeamInvite` | Send team invitation email via Resend |
| `email.sendResponseRateAlert` | Notify owner of low response rate |
| `cron.closeSurveys` | Auto-close surveys past their `closesAt` timestamp |
| `cron.sendReminders` | Check for 48-hour-old unanswered tokens and send reminders |
| `cron.createRecurringSurveys` | Create new instances of recurring surveys on schedule |

---

## 9. Email Templates (Resend)

| Email | Trigger | Content |
|-------|---------|---------|
| Magic Link | User requests login | "Click to sign in" button with token link |
| Team Invite | Owner invites a member | Team name, inviter name, "Join team" button |
| Survey Invite | Survey is sent | Survey title, question count, "Share your feedback" button |
| Survey Reminder | 48 hours, no response | "We haven't heard from you" + original response link |
| Response Rate Alert | <50% at 48 hours | Response rate, "View results" link |
| Manager Digest (P2) | Weekly on Monday | Summary stats, trend direction, notable text excerpts |

---

## 10. Project Structure

```
pulsecheck/
├── app/
│   ├── layout.tsx                          # Root layout, fonts, providers
│   ├── page.tsx                            # Landing page
│   ├── (auth)/
│   │   ├── layout.tsx                      # Centered card layout
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx                      # Sidebar layout
│   │   ├── page.tsx                        # Overview
│   │   ├── surveys/
│   │   │   ├── page.tsx                    # Survey list
│   │   │   ├── new/page.tsx                # Survey builder
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Survey results
│   │   │       └── edit/page.tsx           # Edit draft survey
│   │   ├── trends/page.tsx                 # Trend charts
│   │   ├── team/page.tsx                   # Team management
│   │   └── settings/page.tsx               # Account + team settings
│   └── respond/
│       └── [token]/
│           ├── page.tsx                    # Survey response form
│           └── thanks/page.tsx             # Confirmation
├── components/
│   ├── sidebar.tsx
│   ├── mobile-nav.tsx
│   ├── top-bar.tsx
│   ├── theme-toggle.tsx
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── feature-highlights.tsx
│   │   ├── dashboard-preview.tsx
│   │   ├── pricing-preview.tsx
│   │   └── landing-footer.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── magic-link-sent.tsx
│   ├── dashboard/
│   │   ├── health-score.tsx
│   │   ├── response-rate-card.tsx
│   │   ├── recent-survey-card.tsx
│   │   └── weekly-sparkline.tsx
│   ├── surveys/
│   │   ├── survey-list.tsx
│   │   ├── survey-status-badge.tsx
│   │   ├── survey-builder-form.tsx
│   │   ├── question-card.tsx
│   │   ├── question-type-selector.tsx
│   │   ├── drag-handle.tsx
│   │   ├── template-selector.tsx
│   │   ├── question-bank-panel.tsx
│   │   ├── send-confirm-dialog.tsx
│   │   ├── response-rate-bar.tsx
│   │   ├── rating-chart.tsx
│   │   ├── average-rating-display.tsx
│   │   ├── open-text-list.tsx
│   │   ├── survey-results-summary.tsx
│   │   └── export-csv-button.tsx
│   ├── trends/
│   │   ├── trend-line-chart.tsx
│   │   ├── question-filter.tsx
│   │   ├── trend-summary-cards.tsx
│   │   └── heatmap-grid.tsx
│   ├── team/
│   │   ├── team-member-table.tsx
│   │   ├── invite-member-form.tsx
│   │   ├── role-badge.tsx
│   │   ├── status-badge.tsx
│   │   ├── remove-member-dialog.tsx
│   │   └── promote-dialog.tsx
│   ├── respond/
│   │   ├── response-form.tsx
│   │   ├── rating-input.tsx
│   │   ├── text-input.tsx
│   │   ├── response-submitted.tsx
│   │   └── survey-closed-message.tsx
│   └── settings/
│       ├── account-settings.tsx
│       ├── notification-preferences.tsx
│       ├── team-settings.tsx
│       └── billing-section.tsx
├── convex/
│   ├── schema.ts                           # Schema defined in Section 6
│   ├── users.ts
│   ├── teams.ts
│   ├── teamMembers.ts
│   ├── surveys.ts
│   ├── responses.ts
│   ├── responseTokens.ts
│   ├── savedQuestions.ts
│   ├── trends.ts
│   ├── dashboard.ts
│   ├── email.ts                            # Resend actions
│   └── crons.ts                            # Scheduled jobs
├── lib/
│   ├── auth.ts                             # Auth helpers
│   ├── resend.ts                           # Resend client config
│   └── utils.ts                            # Shared utilities
├── emails/
│   ├── magic-link.tsx                      # React Email template
│   ├── survey-invite.tsx
│   ├── survey-reminder.tsx
│   ├── team-invite.tsx
│   └── response-rate-alert.tsx
├── public/
│   └── og-image.png
├── tailwind.config.ts
├── next.config.ts
├── convex.json
└── package.json
```

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Dashboard load time | < 1s (Convex reactive queries) |
| Survey response page load | < 500ms (minimal JS, public page) |
| Real-time result updates | < 200ms after response submission |
| Landing page Lighthouse perf | >= 90 |
| Email delivery | < 30s from trigger |
| Survey response page bundle | < 100KB gzipped |
| Accessibility | WCAG 2.1 AA |
| Concurrent survey respondents | 500+ without degradation |
| Data retention | Indefinite (all survey history preserved) |

---

## 12. Open Questions

1. Should we support Slack as a response channel (answer surveys inline in Slack) or only as a notification channel?
2. Should recurring surveys copy the previous survey's questions or always use the original template?
3. How do we handle team members who leave — do their past (anonymous) responses stay in the dataset?
4. Should there be a minimum team size to prevent de-anonymization (e.g., 3+ members)?
5. Do we need GDPR data export / deletion support at MVP, or can it wait for v1.0?
