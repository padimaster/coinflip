"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShareResult from "../degen/share-result";

export type GameResultType = "bet" | "flip" | "reward";

export interface BaseGameResult {
  type: GameResultType;
  won?: boolean;
  timestamp: number;
}

export interface BetGameResult extends BaseGameResult {
  type: "bet";
  won: boolean;
  amount: number;
  side: "heads" | "tails";
  result: "heads" | "tails";
}

export interface FlipGameResult extends BaseGameResult {
  type: "flip";
  result: "heads" | "tails";
}

export interface RewardGameResult extends BaseGameResult {
  type: "reward";
  amount: number;
  flipsRequired: number;
  flipsCompleted: number;
}

export type GameResult = BetGameResult | FlipGameResult | RewardGameResult;

export interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame?: () => void;
  result: GameResult | null;
  userAddress?: string;
  showShareButtons?: boolean;
}

export default function GameResultModal({ 
  isOpen, 
  onClose, 
  onNewGame, 
  result, 
  userAddress,
  showShareButtons = true 
}: GameResultModalProps) {
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShareSuccess = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleShareError = (error: string) => {
    console.error('Share error:', error);
  };

  const renderResultContent = () => {
    if (!result) return null;

    switch (result.type) {
      case "bet":
        return (
          <>
            <div className={`pixel-font text-2xl font-bold mb-4 ${
              result.won ? "text-green-300" : "text-red-300"
            }`}>
              {result.won ? "🎉 YOU WON! 🎉" : "😢 YOU LOST"}
            </div>
            
            {result.won && (
              <div className="text-4xl mb-4 animate-bounce">
                🎊 🎈 🎁
              </div>
            )}
            
            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                <p className="text-gray-200 text-sm">
                  <span className="text-white font-bold">You bet:</span> {result.amount} ETH on{' '}
                  <span className={`font-bold ${
                    result.side === 'heads' ? 'text-pink-300' : 'text-blue-300'
                  }`}>
                    {result.side.toUpperCase()}
                  </span>
                </p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                <p className="text-gray-200 text-sm">
                  <span className="text-white font-bold">Result:</span> {result.result.toUpperCase()}
                </p>
              </div>
              
              {result.won && (
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-400">
                  <p className="text-green-200 font-bold text-lg">
                    +{result.amount} ETH
                  </p>
                </div>
              )}
            </div>
          </>
        );

      case "flip":
        return (
          <>
            <div className="pixel-font text-2xl font-bold mb-4 text-blue-300">
              🪙 FLIP RESULT 🪙
            </div>
            
            <div className="text-4xl mb-4">
              {result.result === 'heads' ? '🟡' : '⚫'}
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
              <p className="text-gray-200 text-sm">
                <span className="text-white font-bold">Result:</span>{' '}
                <span className={`font-bold ${
                  result.result === 'heads' ? 'text-pink-300' : 'text-blue-300'
                }`}>
                  {result.result.toUpperCase()}
                </span>
              </p>
            </div>
          </>
        );

      case "reward":
        return (
          <>
            <div className="pixel-font text-2xl font-bold mb-4 text-green-300">
              🎉 REWARD CLAIMED! 🎉
            </div>
            
            <div className="text-4xl mb-4 animate-bounce">
              🎊 🎈 🎁
            </div>
            
            <div className="space-y-3">
              <div className="bg-green-900/30 rounded-lg p-3 border border-green-400">
                <p className="text-green-200 font-bold text-lg">
                  +{result.amount} ETH
                </p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                <p className="text-gray-200 text-sm">
                  <span className="text-white font-bold">Flips completed:</span> {result.flipsCompleted}/{result.flipsRequired}
                </p>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderShareComponent = () => {
    if (!showShareButtons || !result || result.type !== "bet") return null;

    return (
      <ShareResult
        betResult={result as BetGameResult}
        userAddress={userAddress}
        onShareSuccess={handleShareSuccess}
        onShareError={handleShareError}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-2 border-gray-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {renderResultContent()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          {/* Share Success Message */}
          {shareSuccess && (
            <div className="bg-green-900/30 rounded-lg p-3 border border-green-400">
              <p className="text-green-200 text-sm font-bold">
                ✅ Shared successfully!
              </p>
            </div>
          )}
          
          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              <Button
                variant="kawaii"
                className="flex-1"
                onClick={onClose}
              >
                CONTINUE
              </Button>
              {onNewGame && (
                <Button
                  variant="outline"
                  className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-700"
                  onClick={onNewGame}
                >
                  {result?.type === "bet" ? "NEW BET" : "NEW FLIP"}
                </Button>
              )}
            </div>
            
            {renderShareComponent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
