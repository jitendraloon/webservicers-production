import { redirect } from "next/navigation";

export default function AdminMaintenanceIndexPage() {
  redirect("/admin/maintenance/backups");
}
