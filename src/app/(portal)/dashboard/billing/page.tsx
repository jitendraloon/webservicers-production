import { redirect } from "next/navigation";

export default function RedirectBillingPage() {
  redirect("/dashboard/invoices");
}
