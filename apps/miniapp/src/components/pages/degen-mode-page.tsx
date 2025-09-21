"use client";
import DegenModeGame from "@/components/games/degen/degen-mode";

export default function DegenModePage() {
  return (
    <main className="flex flex-col w-full h-[calc(100vh-8rem)]">
      <DegenModeGame />
    </main>
  );
}
