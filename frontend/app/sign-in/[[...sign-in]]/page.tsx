/**
 * app/sign-in/[[...sign-in]]/page.tsx
 * Clerk's hosted sign-in component, centered on the page.
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <SignIn />
    </div>
  );
}
