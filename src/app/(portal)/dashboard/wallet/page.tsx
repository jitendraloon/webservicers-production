import { redirect } from "next/navigation";

export default function RedirectWalletPage() {
  redirect("/dashboard/add-funds");
}
