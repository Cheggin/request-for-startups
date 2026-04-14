# Email Templates (Resend + React Email)

Transactional email system using Resend for delivery and React Email for templates.

## Environment Variables

Add to your `.env`:

```
RESEND_API_KEY=re_...
```

## Setup

1. Install dependencies:

```bash
npm install resend react-email @react-email/components
```

2. Sign up at [resend.com](https://resend.com) and get an API key.

3. Verify your sending domain in the Resend dashboard.

4. Update `DEFAULT_FROM` in `send.ts` with your verified domain.

## Usage

```ts
import { sendEmail } from "@/lib/email/send";
import { WelcomeEmail } from "@/emails/welcome";
import { ResetPasswordEmail } from "@/emails/reset-password";

// Send welcome email
await sendEmail({
  to: "user@example.com",
  subject: "Welcome to YourApp",
  react: WelcomeEmail({ name: "Alice" }),
});

// Send password reset
await sendEmail({
  to: "user@example.com",
  subject: "Reset your password",
  react: ResetPasswordEmail({
    name: "Alice",
    resetUrl: "https://yourdomain.com/reset?token=abc123",
  }),
});
```

## Preview Templates

React Email includes a dev server for previewing templates:

```bash
npx react-email dev
```

This opens a browser UI where you can see each template rendered with sample data.

## Files

| File | Purpose |
|------|---------|
| `send.ts` | Resend wrapper with typed `sendEmail` function |
| `templates/welcome.tsx` | Welcome email for new signups |
| `templates/reset-password.tsx` | Password reset email with expiring link |

## Adding New Templates

1. Create a new `.tsx` file in `templates/`
2. Use `@react-email/components` for layout (`Html`, `Body`, `Container`, `Text`, etc.)
3. Export the component as both named and default export
4. Use inline styles (email clients don't support CSS classes)
5. Add a `<Preview>` tag for inbox preview text
