"use client";
import CoinFlipGame from "@/components/games/free/free-mode";

export default function FreeModePage() {
  return (
    <main className="flex flex-col w-full h-[calc(100vh-8rem)]">
      <CoinFlipGame />
    </main>
  );
}
