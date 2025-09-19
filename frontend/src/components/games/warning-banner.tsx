"use client";
import { WarningBannerProps } from "./types";

export default function WarningBanner({ 
  title = "⚠️ DEGEN WARNING ⚠️", 
  message = "This is gambling. Only bet what you can afford to lose!",
  variant = "danger"
}: WarningBannerProps) {
  const variantStyles = {
    danger: "bg-red-900/30 border-red-400 shadow-red-500/20 text-red-200",
    warning: "bg-yellow-900/30 border-yellow-400 shadow-yellow-500/20 text-yellow-200",
    info: "bg-blue-900/30 border-blue-400 shadow-blue-500/20 text-blue-200"
  };

  const textStyles = {
    danger: "text-red-100",
    warning: "text-yellow-100", 
    info: "text-blue-100"
  };

  return (
    <div className={`${variantStyles[variant]} rounded-xl p-4 border-2 shadow-lg`}>
      <p className={`pixel-font text-sm text-center mb-2 font-bold`}>
        {title}
      </p>
      <p className={`${textStyles[variant]} text-sm text-center leading-relaxed`}>
        {message}
      </p>
    </div>
  );
}
