"use client";

import { createContext, useContext, useState } from "react";
import type { EditableContentKey } from "@/types/content";

type ContentMap = Record<string, string>;

const SiteContentContext = createContext<ContentMap>({});

/**
 * Server component tarafından initialContent ile beslenir.
 * useState(initialContent) → senkron → flash yok.
 */
export function SiteContentProvider({
  initialContent,
  children,
}: {
  initialContent: ContentMap;
  children: React.ReactNode;
}) {
  const [content] = useState<ContentMap>(initialContent);
  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  );
}

/** Public bileşenler bu hook ile içerik okur. */
export function useContentValue(key: EditableContentKey): string | undefined {
  return useContext(SiteContentContext)[key];
}
