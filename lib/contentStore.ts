"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultEditableContent, defaultManagedContent } from "@/lib/defaultContent";
import { isLikelyUrl, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";
import { ContentAuditEvent, EditableContent, EditableContentKey, ManagedContentItem, ManagedContentStatus, ManagedContentType } from "@/types/content";

const storageKey = "dijital-iz-avcisi:editable-content:v1";
const managedStorageKey = "dijital-iz-avcisi:managed-content:v1";
const auditStorageKey = "dijital-iz-avcisi:content-audit:v1";
const changedEventName = "dijital-iz-avcisi-content-changed";
const managedChangedEventName = "dijital-iz-avcisi-managed-content-changed";

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

  // TODO: PostgreSQL entegrasyonu, gercek admin CMS sistemi, markdown destegi,
  // gorsel yukleme, inline live editing ve version history backend'e tasinacak.
  return updatedItems.find((item) => item.key === key)!;
}

export function resetEditableContent(key: EditableContentKey, updatedBy: string) {
  const fallback = defaultEditableContent.find((item) => item.key === key)!;
  return saveEditableContent(key, fallback.content, updatedBy);
}

export function useEditableContent(key: EditableContentKey) {
  const [item, setItem] = useState<EditableContent>(() => getEditableContentByKey(key));

  useEffect(() => {
    const refresh = () => setItem(getEditableContentByKey(key));

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(changedEventName, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(changedEventName, refresh);
    };
  }, [key]);

  return item;
}

export function useEditableContentItems() {
  const [items, setItems] = useState<EditableContent[]>(() => getEditableContentItems());

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

function sanitizeUrl(value: string, maxLength = 500) {
  const trimmed = sanitizeText(value, maxLength);
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }

  if (/^javascript:/i.test(trimmed)) {
    return "";
  }

  return isLikelyUrl(trimmed) ? trimmed : "";
}

function sanitizeTags(tags: string[]) {
  return tags.map((tag) => sanitizeText(tag, 32)).filter(Boolean).slice(0, 12);
}

export function sanitizeManagedContentItem(item: ManagedContentItem): ManagedContentItem {
  return {
    ...item,
    title: sanitizeText(item.title, 160),
    subtitle: sanitizeText(item.subtitle, 160),
    description: sanitizeMultiline(item.description, 800),
    body: sanitizeMultiline(item.body, 8000),
    category: sanitizeText(item.category, 80),
    tags: sanitizeTags(item.tags),
    imageUrl: sanitizeUrl(item.imageUrl),
    altText: sanitizeText(item.altText, 180),
    icon: sanitizeText(item.icon, 24),
    ctaLabel: sanitizeText(item.ctaLabel, 80),
    ctaHref: sanitizeUrl(item.ctaHref),
    value: item.value ? sanitizeText(item.value, 80) : item.value,
    detail: item.detail ? sanitizeText(item.detail, 180) : item.detail,
    readTime: item.readTime ? sanitizeText(item.readTime, 40) : item.readTime,
    publishedAt: item.publishedAt ? sanitizeText(item.publishedAt, 40) : item.publishedAt,
    sourceLabel: item.sourceLabel ? sanitizeText(item.sourceLabel, 120) : item.sourceLabel
  };
}

function sortManagedContent(items: ManagedContentItem[]) {
  return [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function normalizeManagedContent(items: ManagedContentItem[]) {
  const storedById = new Map(items.map((item) => [item.id, item]));
  const normalizedDefaults = defaultManagedContent.map((fallback) => {
    const stored = storedById.get(fallback.id);
    return sanitizeManagedContentItem(stored ? { ...fallback, ...stored } : fallback);
  });
  const defaultIds = new Set(defaultManagedContent.map((item) => item.id));
  const customItems = items.filter((item) => !defaultIds.has(item.id)).map(sanitizeManagedContentItem);
  return sortManagedContent([...normalizedDefaults, ...customItems]);
}

export function getManagedContentItems(): ManagedContentItem[] {
  if (!canUseStorage()) {
    return defaultManagedContent;
  }

  try {
    const raw = window.localStorage.getItem(managedStorageKey);
    if (!raw) {
      return defaultManagedContent;
    }

    const parsed = JSON.parse(raw) as ManagedContentItem[];
    if (!Array.isArray(parsed)) {
      return defaultManagedContent;
    }

    return normalizeManagedContent(parsed);
  } catch {
    return defaultManagedContent;
  }
}

export function getPublishedManagedContent(type?: ManagedContentType): ManagedContentItem[] {
  return getManagedContentItems()
    .filter((item) => item.status === "published" && item.dataMode !== "hidden")
    .filter((item) => (type ? item.type === type : true));
}

function persistManagedContent(items: ManagedContentItem[]) {
  if (canUseStorage()) {
    window.localStorage.setItem(managedStorageKey, JSON.stringify(sortManagedContent(items)));
    window.dispatchEvent(new CustomEvent(managedChangedEventName));
  }
}

function addAuditEvent(event: Omit<ContentAuditEvent, "id" | "createdAt">) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(auditStorageKey);
    const parsed = raw ? (JSON.parse(raw) as ContentAuditEvent[]) : [];
    const next = [
      {
        ...event,
        id: `audit-${Date.now()}`,
        createdAt: new Date().toISOString()
      },
      ...(Array.isArray(parsed) ? parsed : [])
    ].slice(0, 80);
    window.localStorage.setItem(auditStorageKey, JSON.stringify(next));
  } catch {
    // Production audit logging must move server-side and avoid sensitive values.
  }
}

export function getContentAuditEvents(): ContentAuditEvent[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(auditStorageKey);
    const parsed = raw ? (JSON.parse(raw) as ContentAuditEvent[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveManagedContentItem(item: ManagedContentItem, actor = "admin") {
  const items = getManagedContentItems();
  const exists = items.some((current) => current.id === item.id);
  const sanitized = sanitizeManagedContentItem({ ...item, updatedAt: new Date().toISOString() });
  const nextItems = exists ? items.map((current) => (current.id === sanitized.id ? sanitized : current)) : [...items, sanitized];

  persistManagedContent(nextItems);
  addAuditEvent({ action: exists ? "update" : "create", actor, itemId: sanitized.id, itemTitle: sanitized.title });

  // TODO: PostgreSQL/Supabase content table, server-side audit log, markdown support,
  // image upload, inline live editing, version history and per-field diff storage.
  return sanitized;
}

export function createManagedContentItem(type: ManagedContentType, actor = "admin") {
  const now = new Date().toISOString();
  const order = getManagedContentItems().filter((item) => item.type === type).length + 1;
  const item: ManagedContentItem = {
    id: `mc-custom-${type}-${Date.now()}`,
    type,
    title: "Yeni icerik",
    subtitle: "",
    description: "Kisa aciklama girin.",
    body: "",
    category: "Genel",
    tags: [],
    imageUrl: "",
    altText: "",
    icon: "",
    ctaLabel: "",
    ctaHref: "",
    status: "draft",
    order,
    isFeatured: false,
    createdAt: now,
    updatedAt: now,
    dataMode: "real"
  };

  return saveManagedContentItem(item, actor);
}

export function deleteManagedContentItem(id: string, actor = "admin") {
  const items = getManagedContentItems();
  const deleted = items.find((item) => item.id === id);
  persistManagedContent(items.filter((item) => item.id !== id));
  if (deleted) {
    addAuditEvent({ action: "delete", actor, itemId: deleted.id, itemTitle: deleted.title });
  }
}

export function updateManagedContentStatus(id: string, status: ManagedContentStatus, actor = "admin") {
  const item = getManagedContentItems().find((current) => current.id === id);
  if (!item) {
    return null;
  }

  const saved = saveManagedContentItem({ ...item, status }, actor);
  addAuditEvent({ action: status === "published" ? "publish" : status === "draft" ? "draft" : "hide", actor, itemId: saved.id, itemTitle: saved.title });
  return saved;
}

export function resetManagedContent(actor = "admin") {
  persistManagedContent(defaultManagedContent);
  addAuditEvent({ action: "reset", actor, itemId: "all", itemTitle: "Tum icerikler" });
}

export function useManagedContentItems() {
  const [items, setItems] = useState<ManagedContentItem[]>(() => getManagedContentItems());

  useEffect(() => {
    const refresh = () => setItems(getManagedContentItems());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(managedChangedEventName, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(managedChangedEventName, refresh);
    };
  }, []);

  return useMemo(() => items, [items]);
}

export function usePublishedManagedContent(type?: ManagedContentType) {
  const items = useManagedContentItems();
  return useMemo(
    () =>
      items
        .filter((item) => item.status === "published" && item.dataMode !== "hidden")
        .filter((item) => (type ? item.type === type : true))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    [items, type]
  );
}
