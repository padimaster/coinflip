import type { Metadata } from "next";
import "./globals.css";
import { NavigationMenu } from "@/components/layout/navbar";
import { Press_Start_2P } from "next/font/google";
import { BaseProvider } from "@/providers/base.provider";
import Header from "@/components/layout/header";
import WagmiProvider from "@/providers/wagmi-provider";
import { AppNavigationProvider } from "@/contexts/app-navigation.context";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: "Coin Flip",
  description:
    "A kawaii coin flip miniapp for the Base web3 ecosystem. Earn ETH by flipping coins!",
  manifest: "/manifest.json",

  // Open Graph metadata for Base Mini Apps
  openGraph: {
    title: "Coin Flip",
    description:
      "A kawaii coin flip miniapp for the Base web3 ecosystem. Earn ETH by flipping coins!",
    url: process.env.NEXT_PUBLIC_URL || "",
    type: "website",
    siteName: "Coin Flip DApp",
    images: [
      {
        url: process.env.NEXT_PUBLIC_IMAGE_URL || "/favicon.ico",
        width: 512,
        height: 512,
        alt: "Coin Flip DApp",
      },
    ],
  },

  // Twitter metadata
  twitter: {
    card: "summary_large_image",
    title: "Coin Flip",
    description:
      "A kawaii coin flip miniapp for the Base web3 ecosystem. Earn ETH by flipping coins!",
    images: [process.env.NEXT_PUBLIC_IMAGE_URL || "/favicon.ico"],
  },

  // Additional metadata for Base Mini Apps
  keywords: [
    "base",
    "miniapp",
    "coinflip",
    "web3",
    "dapp",
    "ethereum",
    "crypto",
    "games",
  ],
  authors: [{ name: "Coin Flip DApp Team" }],
  category: "games",
};

const pressStart2P = Press_Start_2P({
  weight: "400", // Press Start 2P typically comes in one weight
  subsets: ["latin"],
  variable: "--font-press-start-2p", // Define a CSS variable for the font
  display: "swap", // Optimize font loading
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased ${pressStart2P.variable} bg-[#070d1f] text-white`}
      >
        <WagmiProvider>
          <BaseProvider>
            <AppNavigationProvider>
              <Header />
              {children}
              <NavigationMenu />
            </AppNavigationProvider>
          </BaseProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
