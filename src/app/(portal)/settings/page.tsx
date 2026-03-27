import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailNotifications: true,
      password: true, // just to check if they have one (won't expose)
    },
  });

  if (!user) redirect("/login");

  return (
    <SettingsClient
      userName={user.name || ""}
      userEmail={user.email}
      emailNotifications={user.emailNotifications}
      hasPassword={!!user.password}
    />
  );
}
