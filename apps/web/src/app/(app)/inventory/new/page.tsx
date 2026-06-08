import { redirect } from "next/navigation";

export default function NewProductRedirect() {
  redirect("/inventory?new=1");
}
