"use client";
import { useMemo } from "react";
import { useFlipStore } from "@/lib/store";

export default function HistoryPage() {
  const history = useFlipStore((s) => s.history);
  const flipsCount = useFlipStore((s) => s.flipsCount);

  const { headsCount, tailsCount } = useMemo(() => {
    let heads = 0;
    let tails = 0;
    for (const entry of history) {
      if (entry.result === "heads") heads++;
      else tails++;
    }
    return { headsCount: heads, tailsCount: tails };
  }, [history]);

  const recent = history.slice(0, 20);

  return (
    <main className="flex flex-col w-full h-[calc(100vh-8rem)]">
      <div className="flex flex-col items-center justify-start h-full py-8 px-4">
        <h1 className="text-3xl md:text-4xl mb-6">History</h1>

        <div className="w-full max-w-xl">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 rounded-lg p-4 border-2 border-black">
              <p className=" text-pink-300 text-sm">HEADS</p>
              <p className="text-2xl font-bold text-pink-300">{headsCount}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border-2 border-black">
              <p className=" text-gray-300 text-sm">TAILS</p>
              <p className="text-2xl font-bold text-gray-300">{tailsCount}</p>
            </div>
          </div>

          <div className="bg-black/10 rounded-lg border-2 border-black">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
              <p className="">Recent flips</p>
              <p className="text-sm opacity-70">Total: {flipsCount}</p>
            </div>
            <ul className="divide-y-2 divide-black/30">
              {recent.length === 0 && (
                <li className="px-4 py-4 text-center opacity-70">No flips yet</li>
              )}
              {recent.map((entry) => (
                <li key={entry.id} className="px-4 py-3 flex items-center justify-between">
                  <span className={entry.result === "heads" ? "text-pink-300" : "text-gray-300"}>
                    {entry.result.toUpperCase()}
                  </span>
                  <span className="text-xs opacity-70">
                    {new Date(entry.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
