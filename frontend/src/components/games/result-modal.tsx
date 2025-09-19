"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResultModalProps } from "./types";

export default function ResultModal({ isOpen, onClose, onNewBet, betResult }: ResultModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-2 border-gray-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className={`pixel-font text-2xl font-bold mb-4 ${
              betResult?.won ? "text-green-300" : "text-red-300"
            }`}>
              {betResult?.won ? "🎉 YOU WON! 🎉" : "😢 YOU LOST"}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          {betResult?.won && (
            <div className="text-4xl mb-4 animate-bounce">
              🎊 🎈 🎁
            </div>
          )}
          
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
              <p className="text-gray-200 text-sm">
                <span className="text-white font-bold">You bet:</span> {betResult?.amount} ETH on{' '}
                <span className={`font-bold ${
                  betResult?.side === 'heads' ? 'text-pink-300' : 'text-blue-300'
                }`}>
                  {betResult?.side.toUpperCase()}
                </span>
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
              <p className="text-gray-200 text-sm">
                <span className="text-white font-bold">Result:</span> {betResult?.result.toUpperCase()}
              </p>
            </div>
            
            {betResult?.won && (
              <div className="bg-green-900/30 rounded-lg p-3 border border-green-400">
                <p className="text-green-200 font-bold text-lg">
                  +{betResult.amount} ETH
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="kawaii"
              className="flex-1"
              onClick={onClose}
            >
              CONTINUE
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-700"
              onClick={onNewBet}
            >
              NEW BET
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
