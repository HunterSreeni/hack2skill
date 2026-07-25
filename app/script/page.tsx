import { redirect } from "next/navigation";

// Moved to /user/home.
export default function ScriptRedirect() {
  redirect("/user/home");
}
