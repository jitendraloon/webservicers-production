import { redirect } from "next/navigation";

export default function RedirectTopupPage() {
  redirect("/dashboard/add-funds");
}
