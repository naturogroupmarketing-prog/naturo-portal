"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const handler = () => {
      setVisible(main.scrollTop > 400);
    };
    main.addEventListener("scroll", handler, { passive: true });
    return () => main.removeEventListener("scroll", handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      }}
      data-no-print
      className="fixed bottom-20 lg:bottom-6 right-4 z-40 w-10 h-10 rounded-full bg-white dark:bg-shark-800 border border-shark-200 dark:border-shark-700 shadow-lg flex items-center justify-center text-shark-500 dark:text-shark-400 hover:text-shark-700 dark:hover:text-shark-200 hover:shadow-xl transition-all animate-fade-in"
      aria-label="Scroll to top"
    >
      <Icon name="chevron-up" size={18} />
    </button>
  );
}
