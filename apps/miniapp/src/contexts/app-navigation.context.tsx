"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type ViewType = "flip" | "history" | "degen";

interface AppNavigationContextType {
  currentView: ViewType;
  navigateTo: (view: ViewType) => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>("flip");
  
  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <AppNavigationContext.Provider value={{ currentView, navigateTo }}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (context === undefined) {
    throw new Error("useAppNavigation must be used within an AppNavigationProvider");
  }
  return context;
}
