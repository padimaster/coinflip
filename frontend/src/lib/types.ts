export interface CoinState {
  state: "initial" | "flipping" | "result";
  result: "heads" | "tails";
  buttonText: string;
  headerText: string;
}
