import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-full flex-col overflow-hidden bg-canvas">
        <AdminNav />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </AdminGuard>
  );
}
