"use client";

export type ContactMessageStatus = "new" | "read" | "archived";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  status: ContactMessageStatus;
};

export type ContactMessageInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export type ContactMessageStats = {
  total: number;
  new: number;
  read: number;
  archived: number;
};

const storageKey = "dijital-iz-avcisi:contact-messages:v1";
const changedEventName = "dijital-iz-avcisi-contact-messages-changed";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseMessages(raw: string | null): ContactMessage[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ContactMessage[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((message) => message?.id && message?.name && message?.email && message?.topic && message?.message && message?.createdAt);
  } catch {
    return [];
  }
}

function sortNewestFirst(messages: ContactMessage[]) {
  return [...messages].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getContactMessages() {
  if (!canUseStorage()) return [];

  return sortNewestFirst(parseMessages(window.localStorage.getItem(storageKey)));
}

export function getAllContactMessages() {
  return getContactMessages();
}

export function getLatestContactMessages(limit = 5) {
  return getContactMessages().filter((message) => message.status !== "archived").slice(0, limit);
}

export function getContactMessageStats(): ContactMessageStats {
  const messages = getContactMessages();

  return {
    total: messages.length,
    new: messages.filter((message) => message.status === "new").length,
    read: messages.filter((message) => message.status === "read").length,
    archived: messages.filter((message) => message.status === "archived").length
  };
}

export function saveContactMessage(input: ContactMessageInput) {
  if (!canUseStorage()) {
    throw new Error("Contact message storage is not available.");
  }

  const contactMessage: ContactMessage = {
    id: createId(),
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
    createdAt: new Date().toISOString(),
    status: "new"
  };

  const messages = [contactMessage, ...getContactMessages()].slice(0, 100);
  window.localStorage.setItem(storageKey, JSON.stringify(messages));
  window.dispatchEvent(new Event(changedEventName));

  return contactMessage;
}

function updateContactMessage(id: string, updater: (message: ContactMessage) => ContactMessage) {
  if (!canUseStorage()) return null;

  let updatedMessage: ContactMessage | null = null;
  const messages = getContactMessages().map((message) => {
    if (message.id !== id) return message;

    updatedMessage = updater(message);
    return updatedMessage;
  });

  if (!updatedMessage) return null;

  window.localStorage.setItem(storageKey, JSON.stringify(messages));
  window.dispatchEvent(new Event(changedEventName));

  return updatedMessage;
}

export function markAsRead(id: string) {
  return updateContactMessage(id, (message) => ({ ...message, status: "read" }));
}

export function archiveMessage(id: string) {
  return updateContactMessage(id, (message) => ({ ...message, status: "archived" }));
}

export function subscribeToContactMessages(callback: () => void) {
  if (!canUseStorage()) return () => {};

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) callback();
  }

  window.addEventListener(changedEventName, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(changedEventName, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
