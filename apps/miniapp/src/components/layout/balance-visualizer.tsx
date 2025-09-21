"use client";
import { useAccount } from "wagmi";

interface BalanceVisualizerProps {
  balance: number;
  className?: string;
}

export default function BalanceVisualizer({ balance, className = "" }: BalanceVisualizerProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-300 font-mono">
          {balance.toFixed(4)} ETH
        </span>
      </div>
    </div>
  );
}
