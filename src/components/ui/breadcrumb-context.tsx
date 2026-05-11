"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type Overrides = Record<string, string>;

const BreadcrumbCtx = createContext<{
  overrides: Overrides;
  setOverride: (segment: string, label: string) => void;
}>({ overrides: {}, setOverride: () => {} });

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const setOverride = useCallback((segment: string, label: string) => {
    setOverrides((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
  }, []);
  return (
    <BreadcrumbCtx.Provider value={{ overrides, setOverride }}>
      {children}
    </BreadcrumbCtx.Provider>
  );
}

/** Read all overrides — used by Breadcrumbs component */
export function useBreadcrumbOverrides() {
  return useContext(BreadcrumbCtx).overrides;
}

/** Drop this anywhere in a page to override how a URL segment appears in the breadcrumb */
export function BreadcrumbSetter({ segment, label }: { segment: string; label: string }) {
  const { setOverride } = useContext(BreadcrumbCtx);
  useEffect(() => {
    setOverride(segment, label);
  }, [segment, label, setOverride]);
  return null;
}
