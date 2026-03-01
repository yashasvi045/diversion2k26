/**
 * layout.tsx
 * ----------
 * Root app layout for SiteScapr.
 * Sets up Poppins font, meta tags, and the glassmorphism navbar.
 * All pages inherit this shell.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import GitHubStarButton from "@/components/GitHubStarButton";
import NavUserButton from "@/components/NavUserButton";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteScapr - AI Business Location Intelligence",
  description:
    "Discover the best neighborhoods to open your business in Kolkata. Powered by AI-driven scoring of income, foot traffic, competition, and rent data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
    <html lang="en">
      <head>
        {/* Preconnect for Google Fonts performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-cream text-black antialiased">
        {/* ── Glassmorphism Navbar ── */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <nav className="glass mx-auto max-w-screen-xl px-8 py-3 flex items-center justify-between mt-3 rounded-2xl shadow-glass">
            {/* Brand mark */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="font-bold text-lg tracking-tight">SiteScapr</span>
            </Link>

            {/* Nav links */}
            <NavLinks />

            {/* CTA */}
            <div className="flex items-center gap-2">
              <GitHubStarButton />
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-black px-3 py-2 rounded-xl transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/app"
                  className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Start Analysis
                </Link>
                <NavUserButton />
              </SignedIn>
            </div>
          </nav>
        </header>

        <main className="pt-20">{children}</main>
      </body>
    </html>
    </ClerkProvider>
  );
}
