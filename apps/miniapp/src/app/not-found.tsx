import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070d1f] text-white flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        {/* 404 with coin animation */}
        <div className="relative">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFB6C1] mb-4">
            404
          </h1>
          <div className="flex justify-center">
            <Image
              src="/animations/coin-flip.gif"
              alt="Coin flip animation"
              width={80}
              height={80}
              className="animate-bounce"
            />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#87CEEB]">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-300 text-lg">
            Looks like this page got flipped away! 🪙
          </p>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFB6C1] text-black font-bold rounded-lg hover:from-[#FFB6C1] hover:to-[#87CEEB] transition-all duration-300 transform hover:scale-105"
          >
            🏠 Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-transparent border-2 border-[#87CEEB] text-[#87CEEB] font-bold rounded-lg hover:bg-[#87CEEB] hover:text-black transition-all duration-300"
          >
            ← Go Back
          </button>
        </div>

        {/* Fun message */}
        <div className="mt-8 p-4 bg-[rgba(255,182,193,0.1)] border border-[#FFB6C1] rounded-lg">
          <p className="text-[#FFB6C1] text-sm">
            💡 Pro tip: Try flipping a coin to decide your next move!
          </p>
        </div>
      </div>
    </div>
  );
}
