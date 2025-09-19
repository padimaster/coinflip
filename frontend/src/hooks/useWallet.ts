import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import {
  useIsInMiniApp,
} from "@coinbase/onchainkit/minikit";

export const useWallet = () => {
  const isInMiniApp = useIsInMiniApp();
  const chainId = useChainId();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

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

  // Network detection
  const getCurrentNetwork = () => {
    const networks = {
      84532: { name: "Base Sepolia", isTestnet: true },
      8453: { name: "Base Mainnet", isTestnet: false },
    };

    return (
      networks[chainId as keyof typeof networks] || {
        name: "Unknown Network",
        isTestnet: true,
      }
    );
  };

  console.log(getCurrentNetwork());

  return {
    isInMiniApp,
    isConnected,
    connectWallet,
    disconnectWallet,
    address,
    chainId,
    currentNetwork: getCurrentNetwork(),
  };
};
