/**
 * User menu component.
 *
 * Renders the Clerk UserButton in the app header/nav.
 * Shows avatar, dropdown with account management, and sign-out.
 *
 * Usage:
 *   import { UserMenu } from "@/components/user-menu";
 *
 *   <nav>
 *     <UserMenu />
 *   </nav>
 *
 * @see https://clerk.com/docs/components/user/user-button
 */

"use client";

import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export function UserMenu() {
  return (
    <>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
          userProfileMode="navigation"
          userProfileUrl="/settings"
        />
      </SignedIn>

      <SignedOut>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Get started
          </Link>
        </div>
      </SignedOut>
    </>
  );
}
