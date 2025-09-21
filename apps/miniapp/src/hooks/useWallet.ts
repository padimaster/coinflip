"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useBalance,
} from "wagmi";
import { useIsInMiniApp } from "@coinbase/onchainkit/minikit";

export const useWallet = () => {
  const { isInMiniApp } = useIsInMiniApp();
  const chainId = useChainId();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const connectWallet = async () => {
    try {
      const coinbaseConnector = connectors.find(
        (connector) => connector.name === "Coinbase Wallet"
      );

      if (!coinbaseConnector) {
        throw new Error("Coinbase Wallet connector not found");
      }

      await connect({ connector: coinbaseConnector });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const switchNetwork = async (targetChainId: number) => {
    // In miniapp, only allow Base Mainnet (8453)
    if (isInMiniApp && targetChainId !== 8453) {
      throw new Error("Only Base Mainnet is supported in miniapp");
    }

    try {
      await switchChain({ chainId: targetChainId as 31337 | 8453 | 84532 });
    } catch (error) {
      console.error("Failed to switch network:", error);
      throw error;
    }
  };

  // Network detection
  const getCurrentNetwork = () => {
    const networks = {
      84532: { name: "Base Sepolia", isTestnet: true },
      8453: { name: "Base Mainnet", isTestnet: false },
      31337: { name: "Foundry Network", isTestnet: true },
    };

    return (
      networks[chainId as keyof typeof networks] || {
        name: "Unknown Network",
        isTestnet: true,
      }
    );
  };

  // Check if current network is supported in miniapp
  const isNetworkSupportedInMiniApp = () => {
    return !isInMiniApp || chainId === 8453; // Only Base Mainnet is supported in miniapp
  };

  return {
    isInMiniApp,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    address,
    chainId,
    currentNetwork: getCurrentNetwork(),
    balance: balance ? parseFloat(balance.formatted) : 0,
    isNetworkSupportedInMiniApp: isNetworkSupportedInMiniApp(),
  };
};
