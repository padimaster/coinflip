import Image from "next/image";

export const HeadCoin: React.FC<{ size: number }> = ({ size }) => (
  <Image
    src="/animations/coin-heads.gif"
    alt="Coin showing heads"
    className="w-full h-full object-contain rounded-full"
    width={size}
    height={size}
    unoptimized
  />
);
