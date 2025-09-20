"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Network } from "lucide-react";

const NETWORKS = [
  { id: 8453, name: "Base" },
  { id: 84532, name: "Base Sepolia" },
  { id: 31337, name: "Foundry" },
];

export function NetworkSwitcher() {
  const { chainId, switchNetwork, isConnected, currentNetwork } = useWallet();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    return null;
  }

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (targetChainId === chainId) return;

    try {
      await switchNetwork(targetChainId);
      setOpen(false);
    } catch (error) {
      console.error("Network switch failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
        >
          <Network className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-[rgba(7,13,31,0.95)] backdrop-blur-[10px] border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white font-press-start-2p text-sm text-center">
            NETWORK
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {NETWORKS.map((network) => {
            const isCurrent = chainId === network.id;

            return (
              <Button
                key={network.id}
                variant="ghost"
                onClick={() => handleNetworkSwitch(network.id)}
                disabled={isCurrent}
                className={`w-full font-press-start-2p text-xs ${
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {network.name}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
