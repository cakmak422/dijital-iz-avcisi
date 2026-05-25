"use client";

import { useEditableContent } from "@/lib/contentStore";
import { EditableContentKey } from "@/types/content";

export function EditableContent({
  as = "span",
  className,
  contentKey
}: {
  as?: "span" | "p" | "div" | "h1" | "h2";
  className?: string;
  contentKey: EditableContentKey;
}) {
  const item = useEditableContent(contentKey);
  const Component = as;

  return <Component className={className}>{item.content}</Component>;
}
