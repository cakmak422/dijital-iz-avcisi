"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultEditableContent } from "@/lib/defaultContent";
import { EditableContent, EditableContentKey } from "@/types/content";
import { useContentValue } from "@/lib/contentContext";

const storageKey = "dijital-iz-avcisi:editable-content:v1";
const changedEventName = "dijital-iz-avcisi-content-changed";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeContent(items: EditableContent[]) {
  const storedByKey = new Map(items.map((item) => [item.key, item]));

  return defaultEditableContent.map((fallback) => {
    const stored = storedByKey.get(fallback.key);
    return stored ? { ...fallback, ...stored, title: fallback.title } : fallback;
  });
}

export function getEditableContentItems(): EditableContent[] {
  if (!canUseStorage()) {
    return defaultEditableContent;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultEditableContent;
    }

    const parsed = JSON.parse(raw) as EditableContent[];
    if (!Array.isArray(parsed)) {
      return defaultEditableContent;
    }

    return normalizeContent(parsed);
  } catch {
    return defaultEditableContent;
  }
}

export function getEditableContentByKey(key: EditableContentKey): EditableContent {
  return getEditableContentItems().find((item) => item.key === key) ?? defaultEditableContent.find((item) => item.key === key)!;
}

export function saveEditableContent(key: EditableContentKey, content: string, updatedBy: string) {
  const updatedItems = getEditableContentItems().map((item) =>
    item.key === key
      ? {
          ...item,
          content,
          updatedAt: new Date().toISOString(),
          updatedBy
        }
      : item
  );

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    window.dispatchEvent(new CustomEvent(changedEventName, { detail: { key } }));
  }

  // TODO: PostgreSQL entegrasyonu, gerçek admin CMS sistemi, markdown destegi,
// Görsel yükleme, inline live editing ve version history backend'e taşınacak.
  return updatedItems.find((item) => item.key === key)!;
}

export function resetEditableContent(key: EditableContentKey, updatedBy: string) {
  const fallback = defaultEditableContent.find((item) => item.key === key)!;
  return saveEditableContent(key, fallback.content, updatedBy);
}

export function useEditableContent(key: EditableContentKey) {
  // Context'ten oku (server-side Supabase fetch ile beslenir, flash yok)
  const contextValue = useContentValue(key);
  const fallback = defaultEditableContent.find((item) => item.key === key)!;

  // Context boşsa (context dışında çağrılırsa) localStorage'a düş
  const content = contextValue ?? getEditableContentByKey(key).content;

  return { ...fallback, content };
}

export function useEditableContentItems() {
  const [items, setItems] = useState<EditableContent[]>(() => defaultEditableContent);

  useEffect(() => {
    const refresh = () => setItems(getEditableContentItems());

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(changedEventName, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(changedEventName, refresh);
    };
  }, []);

  return useMemo(() => items, [items]);
}
