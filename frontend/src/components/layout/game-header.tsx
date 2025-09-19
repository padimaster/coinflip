import { useWallet } from "@/hooks/useWallet";
import React from "react";

export default function GameHeader({ headerText }: { headerText: string }) {
  const { address, currentNetwork, isConnected } = useWallet();

  return (
    <div className="mb-8">
      <h1 className="pixel-font text-white text-2xl md:text-3xl text-center">
        {headerText}
      </h1>
      {isConnected && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-300">
            Network: {currentNetwork.name}{" "}
            {currentNetwork.isTestnet && "(Testnet)"}
          </p>
          <p className="text-xs text-gray-400 break-all">
            Contract:{" "}
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not deployed"}
          </p>
        </div>
      )}
    </div>
  );
}
