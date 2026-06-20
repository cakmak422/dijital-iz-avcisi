"use client";

import { EditableContent } from "@/components/admin/content/EditableContent";
import { useEditableContent } from "@/lib/contentStore";

export function ContactInfoCard() {
  const supportEmail = useEditableContent("contact.supportEmail").content;
  const reportEmail = useEditableContent("contact.reportEmail").content;

  return (
    <article className="cyber-card rounded-lg border p-5">
      <EditableContent as="h2" className="text-xl font-bold text-white" contentKey="contact.info.title" />
      <EditableContent as="p" className="mt-2 text-sm leading-6 text-slate-300" contentKey="contact.info.description" />
      <div className="mt-4 grid gap-2 text-sm font-semibold sm:grid-cols-2">
        <a
          className="break-all rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
          href={`mailto:${supportEmail}`}
        >
          {supportEmail}
        </a>
        <a
          className="break-all rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
          href={`mailto:${reportEmail}`}
        >
          {reportEmail}
        </a>
      </div>
    </article>
  );
}
