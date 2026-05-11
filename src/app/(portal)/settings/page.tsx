import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsClient } from "./settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailNotifications: true,
      password: true,
      totpEnabled: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <SettingsClient
      userName={user.name || ""}
      userEmail={user.email}
      userPhone={user.phone || ""}
      emailNotifications={user.emailNotifications}
      hasPassword={!!user.password}
      mfaEnabled={user.totpEnabled}
    />
  );
}
