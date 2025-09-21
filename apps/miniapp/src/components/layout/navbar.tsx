"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useAppNavigation } from "@/contexts/app-navigation.context";

const navItems = [
  { id: "flip", label: "FLIP", view: "flip" as const },
  { id: "history", label: "HISTORY", view: "history" as const },
  { id: "degen", label: "DEGEN MODE", view: "degen" as const },
];

export const NavigationMenu: React.FC = () => {
  const { currentView, navigateTo } = useAppNavigation();

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-[rgba(7,13,31,0.95)] backdrop-blur-[10px] py-4 h-16">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigateTo(tab.view)}
            className={cn(
              "font-['Press_Start_2P'] text-[8px] px-3 py-2 rounded transition-all duration-200 ease-in-out hover:bg-[rgba(255,182,193,0.3)] cursor-pointer",
              currentView === tab.view
                ? "bg-[var(--kawaii-pink)] text-black"
                : "text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
