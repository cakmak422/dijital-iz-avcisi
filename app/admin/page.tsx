import { redirect } from "next/navigation";

export default function LegacyAdminPage() {
  redirect("/giris-yap?next=/ops-console");
}
