"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider as WagmiProviderBase } from "wagmi";
import { getWagmiConfig } from "@/config/wagmi.config";

const queryClient = new QueryClient();
const wagmiConfig = getWagmiConfig();

export default function WagmiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProviderBase>
  );
}
