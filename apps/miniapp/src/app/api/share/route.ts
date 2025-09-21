import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract game data
    const { 
      gameResult, 
      betAmount, 
      winAmount, 
      userAddress, 
      transactionHash,
      side,
      isWin
    } = body;

    // Validate required fields
    if (!gameResult || !betAmount || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: gameResult, betAmount, userAddress' },
        { status: 400 }
      );
    }

    // Create shareable text based on game outcome
    const sideText = side === 'heads' ? 'Heads' : 'Tails';
    const resultEmoji = side === 'heads' ? '🪙' : '🪙';
    
    let shareText: string;
    
    if (isWin) {
      shareText = `🎯 Just won ${winAmount} ETH on Coin Flip! ${sideText} never fails! ${resultEmoji}\n\n💰 Bet: ${betAmount} ETH → Won: ${winAmount} ETH`;
    } else {
      shareText = `🎲 Flipped ${sideText} on Coin Flip! Better luck next time! ${resultEmoji}\n\n💰 Bet: ${betAmount} ETH → Lost: ${betAmount} ETH`;
    }

    // Add transaction link if available
    if (transactionHash) {
      shareText += `\n\n🔗 View on Base: https://basescan.org/tx/${transactionHash}`;
    }

    // Return Farcaster-compatible response
    return NextResponse.json({
      text: `${shareText}\n\n🎮 Play Coin Flip: https://coinflip.ethecuador.org`,
      embeds: [{
        url: "https://coinflip.ethecuador.org",
        castId: {
          fid: process.env.FARCASTER_FID || "12345", // Your app's FID
          hash: transactionHash || "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
      }]
    });

  } catch (error) {
    console.error('Share endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to create share content' },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Coin Flip Share Endpoint',
    usage: 'POST with game data to generate shareable content',
    example: {
      gameResult: 'heads',
      betAmount: '0.001',
      winAmount: '0.002',
      userAddress: '0x...',
      transactionHash: '0x...',
      side: 'heads',
      isWin: true
    }
  });
}
