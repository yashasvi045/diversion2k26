/**
 * app/sign-up/[[...sign-up]]/page.tsx
 * Clerk's hosted sign-up component, centered on the page.
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <SignUp />
    </div>
  );
}
