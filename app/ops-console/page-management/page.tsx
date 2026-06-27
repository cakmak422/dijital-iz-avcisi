"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageManagementDashboard } from "@/components/admin/page-management/PageManagementDashboard";

export default function OpsConsolePageManagementPage() {
  return (
    <AdminGate>
      <AdminShell activeItem="page-management">
        <PageManagementDashboard />
      </AdminShell>
    </AdminGate>
  );
}
