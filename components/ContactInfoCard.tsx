"use client";

import { EditableContent } from "@/components/admin/content/EditableContent";
import { useEditableContent } from "@/lib/contentStore";

export function ContactInfoCard() {
  const supportEmail = useEditableContent("contact.supportEmail").content;
  const reportEmail = useEditableContent("contact.reportEmail").content;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <EditableContent as="h2" className="text-xl font-bold" contentKey="contact.info.title" />
      <EditableContent as="p" className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300" contentKey="contact.info.description" />
      <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:grid-cols-2">
        <a className="break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-cyan-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-cyan-300/10" href={`mailto:${supportEmail}`}>
          {supportEmail}
        </a>
        <a className="break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-cyan-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-cyan-300/10" href={`mailto:${reportEmail}`}>
          {reportEmail}
        </a>
      </div>
    </article>
  );
}
