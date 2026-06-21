import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isAdminOrManager } from "@/lib/permissions";
import { db } from "@/lib/db";
import { CourseBuilderClient } from "./course-builder-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Builder",
  description: "Edit a training course, its settings, sections and lessons",
};

export const dynamic = "force-dynamic";

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdminOrManager(session.user.role)) redirect("/dashboard");

  const organizationId = session.user.organizationId!;
  const { courseId } = await params;

  const course = await db.course.findFirst({
    where: { id: courseId, organizationId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      coverImageUrl: true,
      isMandatory: true,
      estimatedMinutes: true,
      passMark: true,
      requirePassToComplete: true,
      requireSignoff: true,
      certificateEnabled: true,
      certificateValidityDays: true,
      refresherIntervalDays: true,
      sections: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          sortOrder: true,
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  return <CourseBuilderClient course={JSON.parse(JSON.stringify(course))} />;
}
