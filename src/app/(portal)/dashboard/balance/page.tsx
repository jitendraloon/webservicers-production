import { redirect } from "next/navigation";

export default function RedirectBalancePage() {
  redirect("/dashboard/add-funds");
}
