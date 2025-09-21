"use client";

import UnifiedApp from "@/components/pages/unified-app";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return <UnifiedApp />;
}
