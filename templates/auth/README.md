# Auth Integration (Clerk)

Clerk-based authentication for Next.js with middleware route protection, sign-in/sign-up pages, and a user menu component.

## Environment Variables

Add these to your `.env`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Setup

1. Install Clerk:

```bash
npm install @clerk/nextjs
```

2. Copy `middleware.ts` to your project root (not inside `app/` or `src/`).

3. Wrap your root layout with the `AuthProvider`:

```tsx
// app/layout.tsx
import { AuthProvider } from "@/components/providers/auth-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

4. Create sign-in and sign-up pages:

```
app/sign-in/[[...sign-in]]/page.tsx  -> use sign-in.tsx
app/sign-up/[[...sign-up]]/page.tsx  -> use sign-up.tsx
```

5. Add the `UserMenu` component to your navigation header.

## Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Route protection — defines public vs protected routes |
| `provider.tsx` | ClerkProvider wrapper for root layout |
| `sign-in.tsx` | Sign-in page with Clerk's prebuilt component |
| `sign-up.tsx` | Sign-up page with Clerk's prebuilt component |
| `user-button.tsx` | User avatar + dropdown menu for header/nav |

## Customizing Protected Routes

Edit the `isPublicRoute` matcher in `middleware.ts`:

```ts
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/stripe/webhook",  // webhooks must be public
  "/api/health",
]);
```

Any route not listed as public will require authentication.

## Clerk Dashboard

1. Go to [clerk.com/dashboard](https://dashboard.clerk.com)
2. Create an application
3. Enable desired sign-in methods (email, Google, GitHub, etc.)
4. Copy the API keys to your `.env`
