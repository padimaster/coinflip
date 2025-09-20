import Image from "next/image";

export const FlippingCoin: React.FC<{ size: number }> = ({ size }) => (
  <Image
    src="/animations/coin-flip.gif"
    alt="Coin flipping"
    className="w-full h-full object-contain rounded-full"
    width={size}
    height={size}
    unoptimized
  />
);
