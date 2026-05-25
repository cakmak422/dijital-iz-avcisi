import { redirect } from "next/navigation";

export default function LegacyAdminContentPage() {
  redirect("/giris-yap?next=/ops-console");
}
