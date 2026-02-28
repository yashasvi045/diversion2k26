/**
 * app/pricing/page.tsx
 * --------------------
 * SiteScapr pricing page — tier overview and Razorpay checkout (test mode).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

// ── Razorpay types ─────────────────────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const RZP_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Try SiteScapr with no commitment.",
    features: [
      "2 top-ranked results per analysis",
      "Basic neighborhood scores",
      "Map visualization",
      "Kolkata coverage",
    ],
    cta: "Get Started",
    href: "/app",
    highlighted: false,
    plan: null,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "per month",
    description: "Everything you need to make a confident site decision.",
    features: [
      "All ranked results (unlimited)",
      "Full breakdown of all 5 scoring metrics",
      "AI reasoning per neighborhood",
      "Export results as CSV / PDF",
      "Save & compare locations",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: null,
    highlighted: true,
    plan: "pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For teams and multi-city rollouts.",
    features: [
      "Everything in Pro",
      "Multi-city analysis",
      "Custom data integrations",
      "Dedicated account manager",
      "SLA & white-label options",
    ],
    cta: "Contact Sales",
    href: "mailto:hello@sitescapr.com",
    highlighted: false,
    plan: null,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  async function handleProCheckout() {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay. Please check your connection.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      if (!res.ok) throw new Error("Order creation failed");
      const order = await res.json();

      const options = {
        key: RZP_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "SiteScapr",
        description: "Pro Plan — Monthly Subscription",
        image: "/logo.png",
        order_id: order.order_id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // Verify signature on the backend before granting access
          try {
            const verify = await fetch(`${BACKEND}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verify.ok) throw new Error("Signature mismatch");
            setPaymentId(response.razorpay_payment_id);
            setSuccess(true);
          } catch {
            alert("Payment could not be verified. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: { plan: "pro" },
        theme: { color: "#000000" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Success Modal ──────────────────────────────────────────────────── */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center flex flex-col items-center gap-4">
            {/* Checkmark */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold">Payment Successful!</h2>
            <p className="text-gray-500 text-sm">
              Welcome to SiteScapr Pro. Your account has been upgraded.
            </p>
            <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-lg w-full break-all">
              Payment ID: {paymentId}
            </p>
            <button
              onClick={() => { setSuccess(false); }}
              className="mt-2 w-full bg-black text-white font-semibold text-sm py-3 rounded-xl hover:bg-gray-800 transition-all"
            >
              Continue to App →
            </button>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 pt-24 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-700 tracking-wide uppercase">
            Simple Pricing
          </span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
          Choose your plan
        </h1>
        <p className="mt-4 text-gray-500 text-lg max-w-lg mx-auto">
          Start free, upgrade when you need more. No hidden fees.
        </p>
      </section>

      {/* ── Tiers ────────────────────────────────────────────────────────── */}
      <section className="max-w-screen-lg mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 transition-shadow ${
                tier.highlighted
                  ? "border-black shadow-xl bg-black text-white"
                  : "border-gray-200 shadow-sm bg-cream text-black hover:shadow-md"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                  Most Popular
                </span>
              )}

              {/* Name + price */}
              <div>
                <p
                  className={`text-sm font-semibold mb-2 ${
                    tier.highlighted ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {tier.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm mb-1 ${
                      tier.highlighted ? "text-gray-400" : "text-gray-400"
                    }`}
                  >
                    / {tier.period}
                  </span>
                </div>
                <p
                  className={`text-sm mt-2 ${
                    tier.highlighted ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        tier.highlighted ? "text-green-400" : "text-green-600"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <span className={tier.highlighted ? "text-gray-200" : "text-gray-600"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.plan === "pro" ? (
                <button
                  onClick={handleProCheckout}
                  disabled={loading}
                  className="mt-2 w-full text-center font-semibold text-sm py-3 rounded-xl transition-all bg-white text-black hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              ) : (
                <Link
                  href={tier.href!}
                  className={`mt-2 w-full text-center font-semibold text-sm py-3 rounded-xl transition-all ${
                    tier.highlighted
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-gray-400 mt-10">
          All prices in INR. Pro tier includes a 7-day free trial. Cancel anytime.
          Payments powered by Razorpay. Currently in test mode — no real charges.
        </p>
      </section>
      <Footer />
    </div>
  );
}
