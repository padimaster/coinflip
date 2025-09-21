"use client";
import { useState } from "react";
import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { Button } from "@/components/ui/button";
import { BetResult } from "./types";

interface ShareResultProps {
  betResult: BetResult;
  userAddress?: string;
  onShareSuccess?: () => void;
  onShareError?: (error: string) => void;
}

export default function ShareResult({ 
  betResult, 
  userAddress, 
  onShareSuccess, 
  onShareError 
}: ShareResultProps) {
  const { composeCast } = useComposeCast();
  const [isSharing, setIsSharing] = useState(false);

  const generateShareText = () => {
    const result = betResult.won ? "WON" : "LOST";
    const emoji = betResult.won ? "🎉" : "😢";
    const amount = betResult.amount;
    const side = betResult.side.toUpperCase();
    
    return `${emoji} Just ${result} ${amount} ETH betting on ${side} in Coin Flip! 🪙\n\nTry your luck at the kawaii coin flip miniapp on Base! 🎮✨`;
  };

  const generateShareTextWithEmbed = () => {
    const result = betResult.won ? "WON" : "LOST";
    const emoji = betResult.won ? "🎉" : "😢";
    const amount = betResult.amount;
    const side = betResult.side.toUpperCase();
    
    return `${emoji} Just ${result} ${amount} ETH betting on ${side} in Coin Flip! 🪙\n\nCheck out this amazing Base miniapp! 🎮✨`;
  };

  const handleShareAchievement = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const shareText = generateShareText();
      await composeCast({ text: shareText });
      onShareSuccess?.();
    } catch (error) {
      console.error('Share error:', error);
      onShareError?.(error instanceof Error ? error.message : 'Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareWithEmbed = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const shareText = generateShareTextWithEmbed();
      const appUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      
      await composeCast({
        text: shareText,
        embeds: [appUrl],
      });
      onShareSuccess?.();
    } catch (error) {
      console.error('Share with embed error:', error);
      onShareError?.(error instanceof Error ? error.message : 'Failed to share with embed');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="w-full border-blue-500 text-blue-300 hover:bg-blue-700"
        onClick={handleShareAchievement}
        disabled={isSharing}
      >
        {isSharing ? "..." : "📤 Share Achievement"}
      </Button>
      
      <Button
        variant="outline"
        className="w-full border-purple-500 text-purple-300 hover:bg-purple-700"
        onClick={handleShareWithEmbed}
        disabled={isSharing}
      >
        {isSharing ? "..." : "🎮 Share Frame"}
      </Button>
    </div>
  );
}
