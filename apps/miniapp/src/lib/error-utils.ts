/**
 * Utility functions for handling contract errors and providing user-friendly messages
 */

export interface ContractError {
  code: string;
  message: string;
  userMessage: string;
}

/**
 * Maps contract revert messages to user-friendly error messages
 */
export const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  "Daily limit reached for this wallet": "You've reached your daily claim limit. Try again tomorrow!",
  "Invalid nonce": "Invalid request. Please try again.",
  "Insufficient flips": "You need to complete more coin flips before claiming rewards.",
  "Signature expired": "Your claim request has expired. Please try again.",
  "Invalid timestamp": "Invalid request timestamp. Please try again.",
  "Invalid signature": "Invalid signature. Please try again.",
  "Insufficient contract balance": "The faucet is temporarily out of funds. Please try again later.",
  "Transfer failed": "Transaction failed. Please try again.",
  "Not authorized": "Unauthorized request. Please try again.",
  "Contract is paused": "The faucet is temporarily paused. Please try again later.",
};

/**
 * Parses contract error messages and returns user-friendly versions
 */
export function parseContractError(error: any): ContractError {
  let errorMessage = "An unexpected error occurred. Please try again.";
  let userMessage = "Something went wrong. Please try again later.";
  let errorCode = "UNKNOWN_ERROR";

  if (error?.message) {
    const message = error.message;
    
    // Check for specific contract revert messages
    for (const [contractMsg, userMsg] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
      if (message.includes(contractMsg)) {
        errorMessage = contractMsg;
        userMessage = userMsg;
        errorCode = contractMsg.toUpperCase().replace(/\s+/g, "_");
        break;
      }
    }

    // Handle common viem/wagmi errors
    if (message.includes("User rejected")) {
      errorMessage = "Transaction rejected by user";
      userMessage = "Transaction was cancelled. Please try again.";
      errorCode = "USER_REJECTED";
    } else if (message.includes("Insufficient funds")) {
      errorMessage = "Insufficient funds for gas";
      userMessage = "You don't have enough ETH to pay for gas fees.";
      errorCode = "INSUFFICIENT_FUNDS";
    } else if (message.includes("Network error")) {
      errorMessage = "Network error";
      userMessage = "Network connection issue. Please check your internet and try again.";
      errorCode = "NETWORK_ERROR";
    } else if (message.includes("Contract function") && message.includes("reverted")) {
      // Extract the revert reason from viem error messages
      const revertMatch = message.match(/reverted with the following reason:\s*(.+)/);
      if (revertMatch) {
        const revertReason = revertMatch[1].trim();
        errorMessage = revertReason;
        
        // Check if we have a user-friendly message for this revert reason
        if (CONTRACT_ERROR_MESSAGES[revertReason]) {
          userMessage = CONTRACT_ERROR_MESSAGES[revertReason];
          errorCode = revertReason.toUpperCase().replace(/\s+/g, "_");
        } else {
          userMessage = "Transaction failed. Please try again.";
          errorCode = "CONTRACT_REVERT";
        }
      }
    }
  }

  return {
    code: errorCode,
    message: errorMessage,
    userMessage: userMessage,
  };
}

/**
 * Determines if an error is a user-actionable error (not a system error)
 */
export function isUserActionableError(error: ContractError): boolean {
  const nonActionableErrors = [
    "INSUFFICIENT_CONTRACT_BALANCE",
    "CONTRACT_IS_PAUSED",
    "NETWORK_ERROR",
  ];
  
  return !nonActionableErrors.includes(error.code);
}
