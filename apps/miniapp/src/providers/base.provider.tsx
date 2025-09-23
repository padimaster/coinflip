"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { createBaseAccountSDK } from "@base-org/account";
import { base } from "wagmi/chains";

type BaseSDK = ReturnType<typeof createBaseAccountSDK>;

const BaseSDKContext = createContext<BaseSDK | null>(null);

export function BaseProvider({ children }: { children: ReactNode }) {
  const sdk = useMemo(() => createBaseAccountSDK({}), []);

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
          theme: "default",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
      }}
    >
      <BaseSDKContext.Provider value={sdk}>{children}</BaseSDKContext.Provider>
    </OnchainKitProvider>
  );
}

export function useBaseSDK() {
  const ctx = useContext(BaseSDKContext);
  if (!ctx) {
    throw new Error("useBaseSDK must be used within a BaseProvider");
  }
  return ctx;
}

export function useBaseProvider() {
  const sdk = useBaseSDK();
  return sdk.getProvider();
}

export async function requestBaseAccounts(provider: { request: (params: { method: string }) => Promise<unknown> }) {
  const accounts = await provider.request({
    method: "eth_requestAccounts",
  });

  return accounts as string[];
}
