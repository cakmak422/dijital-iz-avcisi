"use client";

// pageManagementStore.ts'ten import yok — circular dependency'yi önler
// Provider her zaman server'dan beslenir, context boş kalmaz

import { createContext, useContext, useState } from "react";
import type { PageManagementState } from "@/types/pageManagement";

const PageManagementContext = createContext<PageManagementState | null>(null);

export function PageManagementProvider({
  initialState,
  children,
}: {
  initialState: PageManagementState;
  children: React.ReactNode;
}) {
  const [state] = useState<PageManagementState>(initialState);
  return (
    <PageManagementContext.Provider value={state}>
      {children}
    </PageManagementContext.Provider>
  );
}

/** null → context sağlanmamış (SSR ya da Provider eksik) */
export function usePageManagementContext(): PageManagementState | null {
  return useContext(PageManagementContext);
}
