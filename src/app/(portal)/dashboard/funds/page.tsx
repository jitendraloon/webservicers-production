import { redirect } from "next/navigation";

export default function RedirectFundsPage() {
  redirect("/dashboard/add-funds");
}
