import Image from "next/image";
import CoinFlipGame from "@/components/games/free-mode";

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <CoinFlipGame />
    </main>
  );
}
