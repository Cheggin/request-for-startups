/**
 * Sign-in page component.
 *
 * Place at app/sign-in/[[...sign-in]]/page.tsx for Clerk's routing to work.
 *
 * @see https://clerk.com/docs/components/authentication/sign-in
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-gray-200 rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
