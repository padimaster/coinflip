import { useState, useEffect } from "react";

export const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Using CoinGecko API to get ETH price in USD
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch ETH price");
        }
        
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (err) {
        console.error("Error fetching ETH price:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEthPrice();
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchEthPrice, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ethPrice,
    isLoading,
    error,
  };
};
