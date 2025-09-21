"use client";

import React, { useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  type Connector,
} from "wagmi";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { NetworkSwitcher } from "../layout/network-switcher";
import { Link, LogOut } from "lucide-react";

export default function Wallet() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const { currentNetwork } = useWallet();
  console.log("currentNetwork", currentNetwork);

  const handleConnect = async (connector: Connector) => {
    try {
      await connect({ connector });
      setOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const getWalletIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "coinbase wallet":
        return "🟦";
      case "metamask":
        return "🦊";
      default:
        return "🔗";
    }
  };

  return (
    <>
      {!isConnected && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="kawaii" className="font-press-start-2p text-sm px-3">
              <Link className="w-4 h-4" /> Connect
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[rgba(7,13,31,0.95)] backdrop-blur-[10px] border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white font-press-start-2p text-sm">
                CHOOSE WALLET
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-xs">
                Select a wallet to connect to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="kawaii"
                  onClick={() => handleConnect(connector)}
                  className="w-full flex items-center gap-3 justify-start text-sm font-press-start-2p"
                >
                  <span className="text-lg">
                    {getWalletIcon(connector.name)}
                  </span>
                  <span>{connector.name.toUpperCase()}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isConnected && (
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleDisconnect}
            variant="kawaii"
            className="font-press-start-2p text-sm px-3"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
}
