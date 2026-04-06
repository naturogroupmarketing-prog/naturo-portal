import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HelpClient } from "./help-client";

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <HelpClient role={session.user.role} />;
}
