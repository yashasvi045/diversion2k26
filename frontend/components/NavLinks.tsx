"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/app", label: "Analyze" },
  { href: "/compare", label: "Compare" },
  { href: "/methodology", label: "Methodology" },
  { href: "/status", label: "Status" },
  { href: "/pricing", label: "Pricing" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-500">
      {links.map(({ href, label }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`transition-colors hover:text-black ${
              isActive ? "font-bold text-black" : ""
            }`}
          >
            {label}
          </Link>
        );
      })}
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
        Kolkata Beta
      </span>
    </div>
  );
}
