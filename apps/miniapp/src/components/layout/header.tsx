"use client";

import React from "react";
import Image from "next/image";
import WalletButton from "../auth/wallet-button";
import { NetworkSwitcher } from "./network-switcher";
import BalanceVisualizer from "./balance-visualizer";
import { useWallet } from "@/hooks/useWallet";

export default function Header() {
  const { balance } = useWallet();

  return (
    <header className="sticky top-0 left-0 right-0 px-4 py-2 bg-[rgba(7,13,31,0.95)] backdrop-blur-[10px] h-16">
      <div className="flex items-center justify-between">
        <Image
          className="h-10 w-10"
          src="/logo.png"
          alt="logo"
          width={100}
          height={100}
        />
        <div className="flex items-center space-x-4">
          <BalanceVisualizer balance={balance} />
          <NetworkSwitcher />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
