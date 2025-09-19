import { getConnectorClient } from "wagmi/actions";
import { getWagmiConfig } from "./wagmi.config";

const config = getWagmiConfig();

export const walletClient = getConnectorClient(config);
