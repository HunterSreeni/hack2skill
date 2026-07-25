import { redirect } from "next/navigation";

// Retired in favor of dedicated /user and /caregiver entry points.
export default function LoginRedirect() {
  redirect("/user");
}
