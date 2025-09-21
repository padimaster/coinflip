import { BetResult } from "@/components/games/degen/types";

export interface ShareData {
  gameResult: string;
  betAmount: string;
  winAmount: string;
  userAddress: string;
  transactionHash?: string;
  side: "heads" | "tails";
  isWin: boolean;
}

export class ShareService {
  private static instance: ShareService;

  public static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  /**
   * Convert bet result to share data format
   */
  public betResultToShareData(
    betResult: BetResult,
    userAddress: string,
    transactionHash?: string
  ): ShareData {
    return {
      gameResult: betResult.result,
      betAmount: betResult.amount.toString(),
      winAmount: betResult.won ? (betResult.amount * 2).toString() : "0",
      userAddress,
      transactionHash,
      side: betResult.side,
      isWin: betResult.won,
    };
  }

  /**
   * Share game result via Farcaster
   */
  public async shareGameResult(shareData: ShareData): Promise<boolean> {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });

      if (!response.ok) {
        throw new Error(`Share failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Share result:', result);
      return true;
    } catch (error) {
      console.error('Error sharing game result:', error);
      return false;
    }
  }

  /**
   * Share via native Web Share API (fallback)
   */
  public async shareViaWebAPI(shareData: ShareData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      const shareText = this.generateShareText(shareData);
      await navigator.share({
        title: 'Coin Flip Result',
        text: shareText,
        url: 'https://coinflip.ethecuador.org',
      });
      return true;
    } catch (error) {
      console.error('Error with Web Share API:', error);
      return false;
    }
  }

  /**
   * Generate share text for fallback sharing
   */
  private generateShareText(shareData: ShareData): string {
    const sideText = shareData.side === 'heads' ? 'Heads' : 'Tails';
    const resultEmoji = shareData.side === 'heads' ? '🪙' : '🪙';
    
    if (shareData.isWin) {
      return `🎯 Just won ${shareData.winAmount} ETH on Coin Flip! ${sideText} never fails! ${resultEmoji}\n\n💰 Bet: ${shareData.betAmount} ETH → Won: ${shareData.winAmount} ETH\n\n🎮 Play at: https://coinflip.ethecuador.org`;
    } else {
      return `🎲 Flipped ${sideText} on Coin Flip! Better luck next time! ${resultEmoji}\n\n💰 Bet: ${shareData.betAmount} ETH → Lost: ${shareData.betAmount} ETH\n\n🎮 Play at: https://coinflip.ethecuador.org`;
    }
  }

  /**
   * Copy share text to clipboard
   */
  public async copyToClipboard(shareData: ShareData): Promise<boolean> {
    try {
      const shareText = this.generateShareText(shareData);
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
}

export const shareService = ShareService.getInstance();
