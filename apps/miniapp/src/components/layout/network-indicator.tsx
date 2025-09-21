"use client";

import { useWallet } from "@/hooks/useWallet";
import { Network } from "lucide-react";

export function NetworkIndicator() {
  const { isInMiniApp, currentNetwork, isConnected } = useWallet();

  // Only show in miniapp when connected
  if (!isInMiniApp || !isConnected) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg">
      <Network className="h-3 w-3 text-blue-300" />
      <span className="text-xs font-press-start-2p text-blue-300">
        {currentNetwork.name}
      </span>
    </div>
  );
}
