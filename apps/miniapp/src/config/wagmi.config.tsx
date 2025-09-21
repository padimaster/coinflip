import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
} from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask } from "wagmi/connectors";
import { customFoundryNetwork } from "./web.config";

export function getWagmiConfig() {
  return createConfig({
    chains: [base, baseSepolia, customFoundryNetwork],
    connectors: [
      coinbaseWallet({
        appName: "Coin Flip",
        preference: "smartWalletOnly",
        version: "4",
      }),
      metaMask(),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [customFoundryNetwork.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getWagmiConfig>;
  }
}
