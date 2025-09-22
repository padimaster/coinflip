"use client";

import dynamic from "next/dynamic";

import FrameProvider from "@/providers/frame.provider";
import { BaseProvider } from "@/providers/base.provider";
import { AppNavigationProvider } from "@/contexts/app-navigation.context";

const WagmiProvider = dynamic(() => import("@/providers/wagmi.provider"), {
  ssr: false,
});

const ErudaProvider = dynamic(() => import("@/providers/eruda.provider"), {
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <FrameProvider>
        <ErudaProvider />
        <BaseProvider>
          <AppNavigationProvider>{children}</AppNavigationProvider>
        </BaseProvider>
      </FrameProvider>
    </WagmiProvider>
  );
}
