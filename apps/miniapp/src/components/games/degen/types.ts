export interface BetResult {
  won: boolean;
  amount: number;
  side: "heads" | "tails";
  result: "heads" | "tails";
}

export type CoinSide = "heads" | "tails";
export type CoinFlipState = "initial" | "flipping" | "result";

export interface GameState {
  state: CoinFlipState;
  result: CoinSide;
  buttonText: string;
  headerText: string;
}

export interface BetAmountSelectorProps {
  betAmount: number;
  onAmountSelect: (amount: number) => void;
  walletBalance: number;
  disabled?: boolean;
  betAmounts?: number[];
}

export interface SideSelectorProps {
  selectedSide: CoinSide | null;
  onSideSelect: (side: CoinSide) => void;
  disabled?: boolean;
}

export interface BetSummaryProps {
  betAmount: number;
  selectedSide: CoinSide | null;
  isPlacingBet: boolean;
  coinState: CoinFlipState;
}

export interface BetStatusProps {
  isPlacingBet: boolean;
  coinState: CoinFlipState;
}

export interface PlaceBetButtonProps {
  selectedSide: CoinSide | null;
  isPlacingBet: boolean;
  walletBalance: number;
  betAmount: number;
  coinState: CoinFlipState;
  onPlaceBet: () => void;
}

export interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewBet: () => void;
  betResult: BetResult | null;
}

export interface WarningBannerProps {
  title?: string;
  message?: string;
  variant?: "danger" | "warning" | "info";
}
