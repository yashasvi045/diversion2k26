/**
 * NavUserButton.tsx
 * -----------------
 * Client component that wraps Clerk's UserButton with a "PRO" badge
 * when the signed-in user has completed a Pro payment.
 * Payment status is persisted to localStorage under the key
 * `sitescapr_pro_paid_<userId>` (set by the pricing page on success).
 */

"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";

export default function NavUserButton() {
  const { user } = useUser();
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setHasPaid(
        localStorage.getItem(`sitescapr_pro_paid_${user.id}`) === "true"
      );
    } else {
      setHasPaid(false);
    }
  }, [user?.id]);

  return (
    <div className="relative inline-flex items-center">
      <UserButton afterSignOutUrl="/" />
      {hasPaid && (
        <span
          className="absolute -top-2 -right-3 z-10 inline-flex items-center justify-center
                     min-w-[28px] h-4 rounded-full bg-green-500 ring-2 ring-white
                     text-[9px] font-extrabold text-white leading-none select-none tracking-wide text-center px-1"
          title="Pro plan active"
        >
          Pro
        </span>
      )}
    </div>
  );
}
