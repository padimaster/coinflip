import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FlipResult = "heads" | "tails";
export type Mode = "flip" | "degen";

export type FlipEntry = { id: string; result: FlipResult; at: number };

type FlipStore = {
  mode: Mode;
  flipsCount: number;
  history: FlipEntry[];
  lastClaimAt: number | null;
  flipsSinceLastClaim: number;
  setMode: (mode: Mode) => void;
  recordFlip: (result: FlipResult) => void;
  setLastClaimAt: (timestamp: number) => void;
  claimReward: () => void;
  reset: () => void;
};

export const useFlipStore = create<FlipStore>()(
  persist(
    (set) => ({
      mode: "flip",
      flipsCount: 0,
      history: [],
      lastClaimAt: null,
      flipsSinceLastClaim: 0,
      setMode: (mode) => set({ mode }),
      recordFlip: (result) =>
        set((state) => ({
          flipsCount: state.flipsCount + 1,
          flipsSinceLastClaim: state.flipsSinceLastClaim + 1,
          history: [
            { id: crypto.randomUUID(), result, at: Date.now() },
            ...state.history,
          ].slice(0, 1000),
        })),
      setLastClaimAt: (timestamp) => set({ lastClaimAt: timestamp }),
      claimReward: () =>
        set(() => ({
          lastClaimAt: Date.now(),
          flipsSinceLastClaim: 0,
        })),
      reset: () => set({ flipsCount: 0, history: [] }),
    }),
    { name: "coin-flip-store" }
  )
);


