/**
 * app/pricing/page.tsx
 * --------------------
 * SiteScapr pricing page — tier overview and CTA.
 * Stripe integration will be wired in a later phase.
 */

import Link from "next/link";
import Footer from "@/components/Footer";

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
    href: "/app",
    highlighted: true,
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
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">
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
              <Link
                href={tier.href}
                className={`mt-2 w-full text-center font-semibold text-sm py-3 rounded-xl transition-all ${
                  tier.highlighted
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-gray-400 mt-10">
          All prices in INR. Pro tier includes a 7-day free trial. Cancel anytime.
          Payment integration coming soon.
        </p>
      </section>
      <Footer />
    </div>
  );
}
