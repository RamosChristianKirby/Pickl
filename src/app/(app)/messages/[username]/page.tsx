// Direct messages were removed from Dinkly. This file is no longer used — you can delete the whole "messages" folder.
import { redirect } from "next/navigation";

export default function RemovedMessagesPage() {
  redirect("/feed");
}
