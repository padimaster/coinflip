"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function SDKProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the SDK on the client side
    sdk.actions.ready().catch((error) => {
      console.error("Failed to initialize Farcaster SDK:", error);
    });
  }, []);

  return <>{children}</>;
}
