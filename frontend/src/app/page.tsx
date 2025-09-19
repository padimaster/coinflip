import Image from "next/image";
import CoinFlipGame from "@/components/games/free/free-mode";

export default function Home() {
  return (
    <main className="flex flex-col min-h-[calc(100vh-8rem)]">
      <CoinFlipGame />
    </main>
  );
}
