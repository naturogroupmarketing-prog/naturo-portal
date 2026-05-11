"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "./button";

interface PullToRefreshProps {
  children: ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when scrolled to top
    const scrollEl = (e.target as HTMLElement).closest("[data-pull-scroll]") || document.scrollingElement;
    if (scrollEl && scrollEl.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPulling(true);
      setPullDistance(Math.min(delta * 0.5, THRESHOLD * 1.5));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5);
      router.refresh();
      setTimeout(() => {
        setRefreshing(false);
        setPulling(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPulling(false);
      setPullDistance(0);
    }
  }, [pullDistance, router]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {(pulling || refreshing) && (
        <div
          className="flex items-center justify-center transition-all duration-200"
          style={{ height: `${pullDistance}px` }}
        >
          {refreshing ? (
            <div className="flex items-center gap-2 text-action-500">
              <Spinner />
              <span className="text-xs font-medium">Refreshing...</span>
            </div>
          ) : (
            <div className={`text-xs font-medium transition-colors ${pullDistance >= THRESHOLD ? "text-action-500" : "text-shark-400"}`}>
              {pullDistance >= THRESHOLD ? "Release to refresh" : "Pull down to refresh"}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
