"use server";

import { db } from "@/lib/db";
import { withAuth, validateForm } from "@/lib/action-utils";
import { hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { CourseStatus } from "@/generated/prisma/client";
import {
  createCourseSchema,
  updateCourseSchema,
  setCourseStatusSchema,
  courseIdSchema,
  sectionSchema,
  updateSectionSchema,
  lessonSchema,
  updateLessonSchema,
  idSchema,
  reorderSchema,
} from "@/lib/validations";

/** Shared gate — only managers with trainingManage may mutate courses. */
async function requireTrainingManage() {
  const session = await withAuth();
  if (!(await hasPermission(session.user.id, session.user.role, "trainingManage"))) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Courses ────────────────────────────────────────────

export async function createCourse(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const {
    title,
    description,
    category,
    isMandatory,
    estimatedMinutes,
    passMark,
    requirePassToComplete,
    requireSignoff,
    certificateEnabled,
    certificateValidityDays,
    refresherIntervalDays,
    coverImageUrl,
  } = validateForm(createCourseSchema, formData);

  // Next sort order for this org
  const last = await db.course.findFirst({
    where: { organizationId, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const course = await db.course.create({
    data: {
      organizationId,
      title,
      description: description || null,
      category,
      coverImageUrl: coverImageUrl || null,
      status: "DRAFT",
      isMandatory,
      estimatedMinutes: estimatedMinutes ?? null,
      passMark: passMark ?? null,
      requirePassToComplete,
      requireSignoff,
      certificateEnabled,
      certificateValidityDays: certificateValidityDays ?? null,
      refresherIntervalDays: refresherIntervalDays ?? null,
      sortOrder,
      createdById: session.user.id,
    },
  });

  await createAuditLog({
    action: "COURSE_CREATED",
    description: `Training course "${title}" created`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId: course.id, category },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${course.id}`);
  return { success: true, courseId: course.id };
}

export async function updateCourse(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const {
    courseId,
    title,
    description,
    category,
    status,
    isMandatory,
    estimatedMinutes,
    passMark,
    requirePassToComplete,
    requireSignoff,
    certificateEnabled,
    certificateValidityDays,
    refresherIntervalDays,
    coverImageUrl,
  } = validateForm(updateCourseSchema, formData);

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.organizationId !== organizationId || course.deletedAt) {
    throw new Error("Not found");
  }

  await db.course.update({
    where: { id: courseId },
    data: {
      title,
      description: description || null,
      category,
      status,
      coverImageUrl: coverImageUrl || null,
      isMandatory,
      estimatedMinutes: estimatedMinutes ?? null,
      passMark: passMark ?? null,
      requirePassToComplete,
      requireSignoff,
      certificateEnabled,
      certificateValidityDays: certificateValidityDays ?? null,
      refresherIntervalDays: refresherIntervalDays ?? null,
    },
  });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Training course "${title}" updated`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId, status },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${courseId}`);
  return { success: true };
}

export async function setCourseStatus(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { courseId, status } = validateForm(setCourseStatusSchema, formData);

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.organizationId !== organizationId || course.deletedAt) {
    throw new Error("Not found");
  }

  await db.course.update({
    where: { id: courseId },
    data: { status: status as CourseStatus },
  });

  const action =
    status === "PUBLISHED"
      ? "COURSE_PUBLISHED"
      : status === "ARCHIVED"
        ? "COURSE_ARCHIVED"
        : "COURSE_UPDATED";

  await createAuditLog({
    action,
    description: `Training course "${course.title}" set to ${status}`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId, status },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${courseId}`);
  return { success: true };
}

export async function deleteCourse(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { courseId } = validateForm(courseIdSchema, formData);

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.organizationId !== organizationId || course.deletedAt) {
    throw new Error("Not found");
  }

  // Soft delete — preserve training history for audit
  await db.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "COURSE_DELETED",
    description: `Training course "${course.title}" deleted`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${courseId}`);
  return { success: true };
}

// ─── Sections ───────────────────────────────────────────

export async function createSection(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { courseId, title, description } = validateForm(sectionSchema, formData);

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.organizationId !== organizationId || course.deletedAt) {
    throw new Error("Not found");
  }

  const last = await db.courseSection.findFirst({
    where: { courseId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const section = await db.courseSection.create({
    data: {
      courseId,
      organizationId,
      title,
      description: description || null,
      sortOrder,
    },
  });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Section "${title}" added to "${course.title}"`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId, sectionId: section.id },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${courseId}`);
  return { success: true, sectionId: section.id };
}

export async function updateSection(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { sectionId, title, description } = validateForm(updateSectionSchema, formData);

  const section = await db.courseSection.findUnique({ where: { id: sectionId } });
  if (!section || section.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  await db.courseSection.update({
    where: { id: sectionId },
    data: { title, description: description || null },
  });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Section "${title}" updated`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId: section.courseId, sectionId },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${section.courseId}`);
  return { success: true };
}

export async function deleteSection(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { id } = validateForm(idSchema, formData);

  const section = await db.courseSection.findUnique({ where: { id } });
  if (!section || section.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  // Hard delete — cascades to lessons via the schema relation
  await db.courseSection.delete({ where: { id } });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Section "${section.title}" deleted`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId: section.courseId, sectionId: id },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${section.courseId}`);
  return { success: true };
}

export async function reorderSection(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { id, direction } = validateForm(reorderSchema, formData);

  const section = await db.courseSection.findUnique({ where: { id } });
  if (!section || section.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  // Find the adjacent section in the same course in the move direction
  const neighbor = await db.courseSection.findFirst({
    where: {
      courseId: section.courseId,
      sortOrder:
        direction === "up"
          ? { lt: section.sortOrder }
          : { gt: section.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });

  if (neighbor) {
    await db.$transaction([
      db.courseSection.update({
        where: { id: section.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      db.courseSection.update({
        where: { id: neighbor.id },
        data: { sortOrder: section.sortOrder },
      }),
    ]);
  }

  revalidatePath("/training");
  revalidatePath(`/training/${section.courseId}`);
  return { success: true };
}

// ─── Lessons ────────────────────────────────────────────

export async function createLesson(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { sectionId, title } = validateForm(lessonSchema, formData);

  const section = await db.courseSection.findUnique({ where: { id: sectionId } });
  if (!section || section.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  const last = await db.lesson.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const lesson = await db.lesson.create({
    data: {
      sectionId,
      courseId: section.courseId, // denormalized from the section
      organizationId,
      title,
      sortOrder,
    },
  });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Lesson "${title}" added`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId: section.courseId, sectionId, lessonId: lesson.id },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${section.courseId}`);
  return { success: true, lessonId: lesson.id };
}

export async function updateLesson(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { lessonId, title } = validateForm(updateLessonSchema, formData);

  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  await db.lesson.update({
    where: { id: lessonId },
    data: { title },
  });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Lesson "${title}" updated`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId: lesson.courseId, lessonId },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${lesson.courseId}`);
  return { success: true };
}

export async function deleteLesson(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { id } = validateForm(idSchema, formData);

  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson || lesson.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  await db.lesson.delete({ where: { id } });

  await createAuditLog({
    action: "COURSE_UPDATED",
    description: `Lesson "${lesson.title}" deleted`,
    performedById: session.user.id,
    organizationId,
    metadata: { courseId: lesson.courseId, lessonId: id },
  });

  revalidatePath("/training");
  revalidatePath(`/training/${lesson.courseId}`);
  return { success: true };
}

export async function reorderLesson(formData: FormData) {
  const session = await requireTrainingManage();
  const organizationId = session.user.organizationId!;

  const { id, direction } = validateForm(reorderSchema, formData);

  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson || lesson.organizationId !== organizationId) {
    throw new Error("Not found");
  }

  // Find the adjacent lesson in the same section in the move direction
  const neighbor = await db.lesson.findFirst({
    where: {
      sectionId: lesson.sectionId,
      sortOrder:
        direction === "up"
          ? { lt: lesson.sortOrder }
          : { gt: lesson.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });

  if (neighbor) {
    await db.$transaction([
      db.lesson.update({
        where: { id: lesson.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      db.lesson.update({
        where: { id: neighbor.id },
        data: { sortOrder: lesson.sortOrder },
      }),
    ]);
  }

  revalidatePath("/training");
  revalidatePath(`/training/${lesson.courseId}`);
  return { success: true };
}
