"use client";

/**
 * PageCogContext
 *
 * Lets any page register the action the bottom-nav cog should perform
 * while that page is mounted. When the user taps the cog in the bottom
 * nav the registered action fires (e.g. open a settings modal). When
 * no action is registered the cog falls back to /settings.
 *
 * Usage in a page/component:
 *   useRegisterPageCog(() => setMyModalOpen(true));
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface PageCogContextValue {
  /** The currently registered action, or null if none */
  cogAction: (() => void) | null;
  /** Pages call this to register (or clear) their cog action */
  setCogAction: (action: (() => void) | null) => void;
}

const PageCogContext = createContext<PageCogContextValue>({
  cogAction: null,
  setCogAction: () => {},
});

export function PageCogProvider({ children }: { children: React.ReactNode }) {
  // Use ref internally to avoid stale closures, expose via state so consumers re-render
  const actionRef = useRef<(() => void) | null>(null);
  const [cogAction, setCogActionState] = useState<(() => void) | null>(null);

  const setCogAction = useCallback((action: (() => void) | null) => {
    actionRef.current = action;
    // Wrap in an arrow so useState doesn't call it as an initialiser
    setCogActionState(action ? () => action : null);
  }, []);

  return (
    <PageCogContext.Provider value={{ cogAction, setCogAction }}>
      {children}
    </PageCogContext.Provider>
  );
}

export function usePageCog() {
  return useContext(PageCogContext);
}

/**
 * Call inside a page/client component to register what the bottom-nav
 * cog should do while this component is mounted.
 *
 * The action is automatically cleared when the component unmounts.
 *
 * @param action  Callback to invoke when the user taps the cog
 * @param deps    Re-register when these values change (like useEffect deps)
 */
export function useRegisterPageCog(action: (() => void) | null, deps: React.DependencyList = []) {
  const { setCogAction } = usePageCog();

  useEffect(() => {
    setCogAction(action);
    return () => setCogAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
