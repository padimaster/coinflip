"use client";

import React, { useState, useEffect, useRef } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "../ui/button";

export default function Wallet() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleConnect = async (connector: any) => {
    try {
      await connect({ connector });
      setShowWalletOptions(false);
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
      case 'coinbase wallet':
        return '🟦';
      case 'metamask':
        return '🦊';
      default:
        return '🔗';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletOptions(false);
      }
    };

    if (showWalletOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletOptions]);

  return (
    <div className="relative" ref={dropdownRef}>
      {!isConnected && (
        <>
          <Button onClick={() => setShowWalletOptions(!showWalletOptions)}>
            Connect Wallet
          </Button>
          
          {showWalletOptions && (
            <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
              <div className="p-2">
                <h3 className="text-sm font-semibold text-white mb-2 px-2">
                  Choose Wallet
                </h3>
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <span className="text-lg">{getWalletIcon(connector.name)}</span>
                    <span className="text-white text-sm">{connector.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {isConnected && (
        <Button onClick={handleDisconnect}>Disconnect Wallet</Button>
      )}
    </div>
  );
}
