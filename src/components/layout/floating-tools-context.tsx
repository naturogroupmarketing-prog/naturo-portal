"use client";

import { createContext, useContext, useState } from "react";

interface FloatingToolsContextType {
  revealed: boolean;
  setRevealed: (v: boolean) => void;
}

const FloatingToolsContext = createContext<FloatingToolsContextType>({
  revealed: false,
  setRevealed: () => {},
});

export function FloatingToolsProvider({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <FloatingToolsContext.Provider value={{ revealed, setRevealed }}>
      {children}
    </FloatingToolsContext.Provider>
  );
}

export function useFloatingTools() {
  return useContext(FloatingToolsContext);
}

/** Thin vertical strip pinned to the right edge — always visible, reveals/hides the tools */
export function FloatingToolsRevealTab() {
  const { revealed, setRevealed } = useFloatingTools();

  return (
    <div
      className="fixed z-40 flex flex-col items-center justify-center gap-1 cursor-pointer group"
      style={{ right: 0, bottom: "120px" }}
      onClick={() => setRevealed(!revealed)}
      title={revealed ? "Hide tools" : "Show tools"}
    >
      {/* The line/strip */}
      <div
        className={`rounded-l-full transition-all duration-300 ${
          revealed
            ? "w-1.5 h-10 bg-shark-300/70 group-hover:bg-shark-400/80"
            : "w-1.5 h-14 bg-shark-300/50 group-hover:bg-shark-400/70 group-hover:h-16"
        }`}
      />
    </div>
  );
}
