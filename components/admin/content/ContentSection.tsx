"use client";

import { ContentEditorCard } from "@/components/admin/content/ContentEditorCard";
import { EditableContent, EditableContentGroup } from "@/types/content";

export function ContentSection({
  group,
  items
}: {
  group: EditableContentGroup;
  items: EditableContent[];
}) {
  const groupItems = group.keys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is EditableContent => Boolean(item));

  return (
    <section className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">{group.title}</p>
        <h2 className="mt-2 text-2xl font-bold">{group.description}</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {groupItems.map((item) => (
          <ContentEditorCard item={item} key={item.key} />
        ))}
      </div>
    </section>
  );
}
