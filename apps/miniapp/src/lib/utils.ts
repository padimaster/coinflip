import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEthAmount(weiAmount: bigint | undefined): string {
  if (!weiAmount) return "0";
  
  // Convert wei to ETH (1 ETH = 10^18 wei)
  const ethAmount = Number(weiAmount) / 1e18;
  
  // Format with appropriate decimal places
  if (ethAmount >= 1) {
    return ethAmount.toFixed(4);
  } else if (ethAmount >= 0.001) {
    return ethAmount.toFixed(6);
  } else {
    return ethAmount.toFixed(8);
  }
}
