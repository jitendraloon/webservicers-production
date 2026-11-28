import type { Metadata } from "next";
import { AdminShell } from "@/components/shell/AdminShell";

export const metadata: Metadata = {
  title: "WebServicers — Unified Admin Console",
  description: "WebServicers Commerce OS, SEO Suite & Operations Admin Panel",
};

export default function AdminLayout({
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
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
