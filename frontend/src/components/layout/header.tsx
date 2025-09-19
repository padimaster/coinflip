import React from "react";
import Image from "next/image";
import WalletButton from "../auth/wallet-button";

export default function Header() {
  return (
    <header className="px-4 py-2 bg-[rgba(7,13,31,0.95)] backdrop-blur-[10px]">
      <div className="flex items-center justify-between">
        <Image src="/logo.png" alt="logo" width={100} height={100} />
        <WalletButton />
      </div>
    </header>
  );
}
