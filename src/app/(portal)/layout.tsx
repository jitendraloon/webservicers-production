import type { Metadata } from "next";
import { DashboardShell } from "@/components/shell/DashboardShell";

export const metadata: Metadata = {
  title: "WebServicers — Customer Portal",
  description: "WebServicers User Dashboard & SEO Suite Workspace",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-cpki-design="workspace"
      data-cpki-theme="light"
      className="min-h-screen bg-[var(--sidebar)] text-[var(--foreground)]"
    >
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
