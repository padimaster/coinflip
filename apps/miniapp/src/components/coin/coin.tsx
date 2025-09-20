import React from "react";
import { TailCoin } from "./tail-coin";
import { HeadCoin } from "./head-coin";
import { FlippingCoin } from "./flipping-coin";

interface CoinProps {
  state: "initial" | "flipping" | "result";
  result: "heads" | "tails";
}

export default function Coin({ state, result }: CoinProps) {
  return (
    <div className="h-40 w-40 coin-container cursor-pointer transition-all duration-300 hover:scale-105">
      {state === "initial" && <HeadCoin size={100} />}
      {state === "flipping" && <FlippingCoin size={100} />}
      {state === "result" &&
        (result === "heads" ? (
          <HeadCoin size={100} />
        ) : (
          <TailCoin size={100} />
        ))}
    </div>
  );
}
