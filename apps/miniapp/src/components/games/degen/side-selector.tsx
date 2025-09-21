"use client";
import { SideSelectorProps } from "./types";

export default function SideSelector({ selectedSide, onSideSelect, disabled = false }: SideSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="pixel-font text-white text-sm mb-3 text-center font-bold">
        CHOOSE YOUR SIDE
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`flex gap-2 items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
            selectedSide === "heads"
              ? "border-pink-400 bg-pink-500/30 shadow-lg shadow-pink-500/25"
              : "border-gray-500 bg-gray-700/50 hover:border-gray-400 hover:bg-gray-600/50"
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => onSideSelect("heads")}
          disabled={disabled}
        >
          <div className="text-3xl mb-2">😊</div>
          <p className={`pixel-font text-sm font-bold ${
            selectedSide === "heads" ? "text-pink-200" : "text-gray-300"
          }`}>HEADS</p>
        </button>
        <button
          className={`flex gap-2 items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
            selectedSide === "tails"
              ? "border-blue-400 bg-blue-500/30 shadow-lg shadow-blue-500/25"
              : "border-gray-500 bg-gray-700/50 hover:border-gray-400 hover:bg-gray-600/50"
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => onSideSelect("tails")}
          disabled={disabled}
        >
          <div className="text-3xl mb-2">⚪</div>
          <p className={`pixel-font text-sm font-bold ${
            selectedSide === "tails" ? "text-blue-200" : "text-gray-300"
          }`}>TAILS</p>
        </button>
      </div>
    </div>
  );
}
