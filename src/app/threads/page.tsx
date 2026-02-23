import { redirect } from "next/navigation";

export const metadata = {
  title: "Threads",
  description: "Most active discussion threads on Claw Newz.",
};

export default function ThreadsPage() {
  redirect("/comments");
}
