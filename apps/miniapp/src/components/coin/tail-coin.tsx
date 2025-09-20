import Image from "next/image";

export const TailCoin: React.FC<{ size: number }> = ({ size }) => (
  <Image
    src="/animations/coin-tails.gif"
    alt="Coin showing tails"
    className="w-full h-full object-contain rounded-full"
    width={size}
    height={size}
    unoptimized
  />
);
