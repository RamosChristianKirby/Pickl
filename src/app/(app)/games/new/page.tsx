// Games were removed from Dinkly. This file is no longer used — you can delete the whole "games" folder.
import { redirect } from "next/navigation";

export default function RemovedGamesPage() {
  redirect("/feed");
}
