import { redirect } from "next/navigation";

// Moved to /user/checkin.
export default function CheckinRedirect() {
  redirect("/user/checkin");
}
