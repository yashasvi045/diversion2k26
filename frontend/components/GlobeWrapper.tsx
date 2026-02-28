"use client";

import dynamic from "next/dynamic";

const GlobeScene = dynamic(() => import("@/components/GlobeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-64 h-64 rounded-full bg-gradient-to-br from-green-50 to-green-100 animate-pulse" />
    </div>
  ),
});

export default function GlobeWrapper() {
  return <GlobeScene />;
}
