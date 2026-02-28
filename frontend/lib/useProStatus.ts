/**
 * useProStatus.ts
 * ---------------
 * Shared hook that returns the current user's authentication and
 * Pro payment status.
 *
 * Payment status is persisted in localStorage under the key
 * `sitescapr_pro_paid_<userId>`, written by the pricing page on
 * a successful Razorpay payment + backend verification.
 */

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export function useProStatus() {
  const { isSignedIn, user } = useUser();
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

  return { isSignedIn: !!isSignedIn, hasPaid };
}
