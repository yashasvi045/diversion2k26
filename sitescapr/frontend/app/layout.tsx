/**
 * layout.tsx
 * ----------
 * Root app layout for SiteScapr.
 * Sets up Poppins font, meta tags, and the glassmorphism navbar.
 * All pages inherit this shell.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteScapr — AI Business Location Intelligence",
  description:
    "Discover the best neighborhoods to open your business in Kolkata. Powered by AI-driven scoring of income, foot traffic, competition, and rent data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for Google Fonts performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-white text-black antialiased">
        {/* ── Glassmorphism Navbar ── */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <nav className="glass mx-auto max-w-screen-xl px-8 py-3 flex items-center justify-between mt-3 rounded-2xl shadow-glass">
            {/* Brand mark */}
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </span>
              <span className="font-bold text-lg tracking-tight">SiteScapr</span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
              <a href="#app" className="hover:text-black transition-colors">
                Analyze
              </a>
              <a href="#results" className="hover:text-black transition-colors">
                Results
              </a>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                Kolkata Beta
              </span>
            </div>

            {/* CTA */}
            <a
              href="#app"
              className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Start Analysis
            </a>
          </nav>
        </header>

        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
