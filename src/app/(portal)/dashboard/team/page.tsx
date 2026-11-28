import { redirect } from "next/navigation";

export default function DashboardTeamRedirect() {
  redirect("/dashboard/sub-accounts");
}
