"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "flip", label: "FLIP", href: "/" },
  { id: "history", label: "HISTORY", href: "/history" },
  { id: "degen", label: "DEGEN MODE", href: "/degen" },
];

export const NavigationMenu: React.FC<{}> = () => {
  const pathname = usePathname();
  const activeTab = pathname;

  console.log(activeTab);
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-[rgba(7,13,31,0.95)] backdrop-blur-[10px] py-4 h-16">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((tab) => (
          <Link
            key={tab.id}
            className={cn(
              "font-['Press_Start_2P'] text-[8px] no-underline px-3 py-2 rounded transition-all duration-200 ease-in-out hover:bg-[rgba(255,182,193,0.3)]",
              activeTab === tab.href
                ? "bg-[var(--kawaii-pink)] text-black"
                : "text-white"
            )}
            href={tab.href}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
