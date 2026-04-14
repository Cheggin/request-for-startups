/**
 * ClerkProvider wrapper.
 *
 * Wrap your root layout with this provider to enable authentication
 * across the entire application.
 *
 * Usage in app/layout.tsx:
 *
 *   import { AuthProvider } from "@/components/providers/auth-provider";
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <AuthProvider>{children}</AuthProvider>
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * @see https://clerk.com/docs/components/clerk-provider
 */

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
