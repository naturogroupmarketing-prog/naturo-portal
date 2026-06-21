import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { TrainingClient } from "./training-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training",
  description: "Build and manage staff induction and training courses",
};

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;

  const courses = await db.course.findMany({
    where: { organizationId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      coverImageUrl: true,
      isMandatory: true,
      estimatedMinutes: true,
      createdAt: true,
      _count: { select: { sections: true, enrollments: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.status === "PUBLISHED").length,
    drafts: courses.filter((c) => c.status === "DRAFT").length,
    mandatory: courses.filter((c) => c.isMandatory).length,
  };

  return (
    <TrainingClient
      courses={JSON.parse(JSON.stringify(courses))}
      stats={stats}
    />
  );
}
