"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CourseCategory, CourseStatus } from "@/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_OPTIONS,
  courseStatusBadge,
  type CourseStatusTone,
} from "@/lib/training";
import {
  updateCourse,
  setCourseStatus,
  deleteCourse,
  createSection,
  updateSection,
  deleteSection,
  reorderSection,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLesson,
} from "@/app/actions/training";

interface LessonItem {
  id: string;
  title: string;
  sortOrder: number;
}
interface SectionItem {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: LessonItem[];
}
interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  category: CourseCategory;
  status: CourseStatus;
  coverImageUrl: string | null;
  isMandatory: boolean;
  estimatedMinutes: number | null;
  passMark: number | null;
  requirePassToComplete: boolean;
  requireSignoff: boolean;
  certificateEnabled: boolean;
  certificateValidityDays: number | null;
  refresherIntervalDays: number | null;
  sections: SectionItem[];
}

const TONE_CLASSES: Record<CourseStatusTone, string> = {
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  draft: "bg-shark-100 text-shark-600 dark:bg-shark-800 dark:text-shark-300",
  archived: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

function StatusPill({ status }: { status: CourseStatus }) {
  const { label, tone } = courseStatusBadge(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded-[6px] border-shark-300 text-action-500 focus:ring-action-500/30"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-shark-700 dark:text-shark-200">{label}</span>
        {hint && <span className="block text-xs text-shark-400 dark:text-shark-500">{hint}</span>}
      </span>
    </label>
  );
}

export function CourseBuilderClient({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState({
    title: course.title,
    description: course.description ?? "",
    category: course.category,
    status: course.status,
    isMandatory: course.isMandatory,
    estimatedMinutes: course.estimatedMinutes?.toString() ?? "",
    passMark: course.passMark?.toString() ?? "",
    requirePassToComplete: course.requirePassToComplete,
    requireSignoff: course.requireSignoff,
    certificateEnabled: course.certificateEnabled,
    certificateValidityDays: course.certificateValidityDays?.toString() ?? "",
    refresherIntervalDays: course.refresherIntervalDays?.toString() ?? "",
  });

  // Section / lesson dialogs
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [renameSectionTarget, setRenameSectionTarget] = useState<SectionItem | null>(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<SectionItem | null>(null);

  const [addLessonFor, setAddLessonFor] = useState<SectionItem | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [renameLessonTarget, setRenameLessonTarget] = useState<LessonItem | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<LessonItem | null>(null);

  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);

  async function run(
    fn: () => Promise<unknown>,
    okMsg: string,
    after?: () => void
  ): Promise<boolean> {
    setBusy(true);
    try {
      await fn();
      addToast(okMsg, "success");
      router.refresh();
      after?.();
      return true;
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Something went wrong", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  // ── Course settings ──
  function openSettings() {
    setForm({
      title: course.title,
      description: course.description ?? "",
      category: course.category,
      status: course.status,
      isMandatory: course.isMandatory,
      estimatedMinutes: course.estimatedMinutes?.toString() ?? "",
      passMark: course.passMark?.toString() ?? "",
      requirePassToComplete: course.requirePassToComplete,
      requireSignoff: course.requireSignoff,
      certificateEnabled: course.certificateEnabled,
      certificateValidityDays: course.certificateValidityDays?.toString() ?? "",
      refresherIntervalDays: course.refresherIntervalDays?.toString() ?? "",
    });
    setSettingsOpen(true);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast("Please enter a course title", "error");
      return;
    }
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("title", form.title.trim());
    fd.set("description", form.description.trim());
    fd.set("category", form.category);
    fd.set("status", form.status);
    fd.set("isMandatory", form.isMandatory ? "true" : "false");
    fd.set("requirePassToComplete", form.requirePassToComplete ? "true" : "false");
    fd.set("requireSignoff", form.requireSignoff ? "true" : "false");
    fd.set("certificateEnabled", form.certificateEnabled ? "true" : "false");
    fd.set("estimatedMinutes", form.estimatedMinutes.trim());
    fd.set("passMark", form.passMark.trim());
    fd.set("certificateValidityDays", form.certificateValidityDays.trim());
    fd.set("refresherIntervalDays", form.refresherIntervalDays.trim());
    await run(() => updateCourse(fd), "Course settings saved", () => setSettingsOpen(false));
  }

  // ── Status ──
  function changeStatus(status: CourseStatus, okMsg: string) {
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("status", status);
    run(() => setCourseStatus(fd), okMsg);
  }

  // ── Sections ──
  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("title", sectionTitle.trim());
    fd.set("description", sectionDesc.trim());
    const ok = await run(() => createSection(fd), "Section added");
    if (ok) {
      setAddSectionOpen(false);
      setSectionTitle("");
      setSectionDesc("");
    }
  }

  async function saveSectionRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameSectionTarget || !sectionTitle.trim()) return;
    const fd = new FormData();
    fd.set("sectionId", renameSectionTarget.id);
    fd.set("title", sectionTitle.trim());
    fd.set("description", sectionDesc.trim());
    const ok = await run(() => updateSection(fd), "Section updated");
    if (ok) setRenameSectionTarget(null);
  }

  function moveSection(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    run(() => reorderSection(fd), "Reordered");
  }

  async function confirmDeleteSection() {
    if (!deleteSectionTarget) return;
    const fd = new FormData();
    fd.set("id", deleteSectionTarget.id);
    const ok = await run(() => deleteSection(fd), "Section deleted");
    if (ok) setDeleteSectionTarget(null);
  }

  // ── Lessons ──
  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!addLessonFor || !lessonTitle.trim()) return;
    const fd = new FormData();
    fd.set("sectionId", addLessonFor.id);
    fd.set("title", lessonTitle.trim());
    const ok = await run(() => createLesson(fd), "Lesson added");
    if (ok) {
      setAddLessonFor(null);
      setLessonTitle("");
    }
  }

  async function saveLessonRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameLessonTarget || !lessonTitle.trim()) return;
    const fd = new FormData();
    fd.set("lessonId", renameLessonTarget.id);
    fd.set("title", lessonTitle.trim());
    const ok = await run(() => updateLesson(fd), "Lesson updated");
    if (ok) setRenameLessonTarget(null);
  }

  function moveLesson(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    run(() => reorderLesson(fd), "Reordered");
  }

  async function confirmDeleteLesson() {
    if (!deleteLessonTarget) return;
    const fd = new FormData();
    fd.set("id", deleteLessonTarget.id);
    const ok = await run(() => deleteLesson(fd), "Lesson deleted");
    if (ok) setDeleteLessonTarget(null);
  }

  async function confirmDeleteCourse() {
    const fd = new FormData();
    fd.set("courseId", course.id);
    const ok = await run(() => deleteCourse(fd), "Course deleted");
    if (ok) {
      setDeleteCourseOpen(false);
      router.push("/training");
    }
  }

  const sections = course.sections;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-shark-500 hover:text-shark-800 dark:text-shark-400 dark:hover:text-shark-200 transition-colors"
        >
          <Icon name="arrow-left" size={16} />
          All courses
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-shark-900 dark:text-white">
                {course.title}
              </h1>
              <StatusPill status={course.status} />
            </div>
            <p className="mt-1 text-sm text-shark-500 dark:text-shark-400">
              {COURSE_CATEGORY_LABELS[course.category]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {course.status !== "PUBLISHED" && (
              <Button variant="primary" onClick={() => changeStatus("PUBLISHED", "Course published")} disabled={busy}>
                <Icon name="check-circle" size={18} className="mr-1.5" />
                Publish
              </Button>
            )}
            {course.status === "PUBLISHED" && (
              <Button variant="outline" onClick={() => changeStatus("DRAFT", "Course set to draft")} disabled={busy}>
                Unpublish
              </Button>
            )}
            {course.status !== "ARCHIVED" ? (
              <Button variant="outline" onClick={() => changeStatus("ARCHIVED", "Course archived")} disabled={busy}>
                Archive
              </Button>
            ) : (
              <Button variant="outline" onClick={() => changeStatus("DRAFT", "Course restored")} disabled={busy}>
                Restore
              </Button>
            )}
            <Button variant="outline" onClick={openSettings} disabled={busy}>
              <Icon name="settings" size={18} className="mr-1.5" />
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeleteCourseOpen(true)}
              disabled={busy}
              aria-label="Delete course"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Icon name="trash-2" size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-shark-500 dark:text-shark-400">
            Curriculum
          </p>
          {sections.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => { setSectionTitle(""); setSectionDesc(""); setAddSectionOpen(true); }} disabled={busy}>
              <Icon name="plus" size={16} className="mr-1" />
              Add section
            </Button>
          )}
        </div>

        {sections.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="file-text"
              title="Build your course"
              description="Add your first section, then add lessons inside it. You'll add lesson content (text, video, checklists, quizzes) in the next step."
              action={{ label: "Add section", onClick: () => { setSectionTitle(""); setSectionDesc(""); setAddSectionOpen(true); } }}
            />
          </Card>
        ) : (
          sections.map((section, si) => (
            <Card key={section.id} padding="md">
              {/* Section header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-shark-400 dark:text-shark-500">
                    Section {si + 1}
                  </div>
                  <h2 className="mt-0.5 text-base font-bold tracking-tight text-shark-900 dark:text-white truncate">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="mt-0.5 text-sm text-shark-500 dark:text-shark-400 line-clamp-2">
                      {section.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" aria-label="Move section up" disabled={busy || si === 0} onClick={() => moveSection(section.id, "up")} className="px-2">
                    <Icon name="chevron-up" size={18} />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Move section down" disabled={busy || si === sections.length - 1} onClick={() => moveSection(section.id, "down")} className="px-2">
                    <Icon name="chevron-down" size={18} />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Rename section" disabled={busy} onClick={() => { setSectionTitle(section.title); setSectionDesc(section.description ?? ""); setRenameSectionTarget(section); }} className="px-2">
                    <Icon name="edit" size={18} />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Delete section" disabled={busy} onClick={() => setDeleteSectionTarget(section)} className="px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Icon name="trash-2" size={18} />
                  </Button>
                </div>
              </div>

              {/* Lessons */}
              <div className="mt-4 space-y-2">
                {section.lessons.length === 0 ? (
                  <p className="text-sm text-shark-400 dark:text-shark-500 px-1 py-2">No lessons yet.</p>
                ) : (
                  section.lessons.map((lesson, li) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-[16px] border border-shark-100 dark:border-white/[0.06] bg-shark-50/60 dark:bg-shark-800/50 px-3 py-2.5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-white dark:bg-shark-900 text-xs font-bold tabular-nums text-shark-500 dark:text-shark-400 border border-shark-100 dark:border-white/[0.06]">
                        {li + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-shark-800 dark:text-shark-100 truncate">
                        {lesson.title}
                      </span>
                      <span
                        title="Lesson editor — coming in the next phase"
                        className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-shark-400 dark:text-shark-500 bg-white dark:bg-shark-900 border border-dashed border-shark-200 dark:border-white/[0.08] cursor-not-allowed"
                      >
                        <Icon name="edit" size={13} />
                        Edit content (soon)
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" aria-label="Move lesson up" disabled={busy || li === 0} onClick={() => moveLesson(lesson.id, "up")} className="px-1.5">
                          <Icon name="chevron-up" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Move lesson down" disabled={busy || li === section.lessons.length - 1} onClick={() => moveLesson(lesson.id, "down")} className="px-1.5">
                          <Icon name="chevron-down" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Rename lesson" disabled={busy} onClick={() => { setLessonTitle(lesson.title); setRenameLessonTarget(lesson); }} className="px-1.5">
                          <Icon name="edit" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Delete lesson" disabled={busy} onClick={() => setDeleteLessonTarget(lesson)} className="px-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Icon name="trash-2" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setLessonTitle(""); setAddLessonFor(section); }} className="text-action-600 dark:text-action-400">
                  <Icon name="plus" size={16} className="mr-1" />
                  Add lesson
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add section modal */}
      <Modal open={addSectionOpen} onClose={() => !busy && setAddSectionOpen(false)} title="Add section">
        <form onSubmit={addSection} className="space-y-4">
          <FormField label="Section title" required>
            <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="e.g. Welcome" maxLength={200} />
          </FormField>
          <FormField label="Description" hint="Optional — a short intro for this section.">
            <textarea value={sectionDesc} onChange={(e) => setSectionDesc(e.target.value)} maxLength={2000} className="w-full rounded-[20px] border border-shark-200 dark:border-white/[0.10] bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm text-shark-900 dark:text-white focus:border-action-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 transition-all min-h-[72px] resize-y" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddSectionOpen(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy}>Add section</Button>
          </div>
        </form>
      </Modal>

      {/* Rename section modal */}
      <Modal open={!!renameSectionTarget} onClose={() => !busy && setRenameSectionTarget(null)} title="Edit section">
        <form onSubmit={saveSectionRename} className="space-y-4">
          <FormField label="Section title" required>
            <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} maxLength={200} />
          </FormField>
          <FormField label="Description">
            <textarea value={sectionDesc} onChange={(e) => setSectionDesc(e.target.value)} maxLength={2000} className="w-full rounded-[20px] border border-shark-200 dark:border-white/[0.10] bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm text-shark-900 dark:text-white focus:border-action-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 transition-all min-h-[72px] resize-y" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRenameSectionTarget(null)} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Add lesson modal */}
      <Modal open={!!addLessonFor} onClose={() => !busy && setAddLessonFor(null)} title="Add lesson">
        <form onSubmit={addLesson} className="space-y-4">
          <FormField label="Lesson title" required>
            <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. Company Overview" maxLength={200} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddLessonFor(null)} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy}>Add lesson</Button>
          </div>
        </form>
      </Modal>

      {/* Rename lesson modal */}
      <Modal open={!!renameLessonTarget} onClose={() => !busy && setRenameLessonTarget(null)} title="Edit lesson">
        <form onSubmit={saveLessonRename} className="space-y-4">
          <FormField label="Lesson title" required>
            <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} maxLength={200} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRenameLessonTarget(null)} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Settings modal */}
      <Modal open={settingsOpen} onClose={() => !busy && setSettingsOpen(false)} title="Course settings">
        <form onSubmit={saveSettings} className="space-y-4">
          <FormField label="Course title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
          </FormField>
          <FormField label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={5000} className="w-full rounded-[20px] border border-shark-200 dark:border-white/[0.10] bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm text-shark-900 dark:text-white focus:border-action-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 transition-all min-h-[88px] resize-y" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Category" required>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CourseCategory })}>
                {COURSE_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </FormField>
            <FormField label="Estimated minutes" hint="Roughly how long to complete.">
              <Input type="number" min={0} value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })} />
            </FormField>
            <FormField label="Pass mark (%)" hint="Quiz score required to pass.">
              <Input type="number" min={0} max={100} value={form.passMark} onChange={(e) => setForm({ ...form, passMark: e.target.value })} />
            </FormField>
            <FormField label="Certificate valid for (days)" hint="Blank = never expires.">
              <Input type="number" min={0} value={form.certificateValidityDays} onChange={(e) => setForm({ ...form, certificateValidityDays: e.target.value })} />
            </FormField>
            <FormField label="Refresher every (days)" hint="Blank = no refresher.">
              <Input type="number" min={0} value={form.refresherIntervalDays} onChange={(e) => setForm({ ...form, refresherIntervalDays: e.target.value })} />
            </FormField>
          </div>
          <div className="space-y-3 rounded-[20px] border border-shark-100 dark:border-white/[0.06] p-4">
            <Toggle label="Mandatory" hint="Required for assigned staff." checked={form.isMandatory} onChange={(v) => setForm({ ...form, isMandatory: v })} />
            <Toggle label="Require passing to complete" hint="Staff must pass the quiz to finish." checked={form.requirePassToComplete} onChange={(v) => setForm({ ...form, requirePassToComplete: v })} />
            <Toggle label="Require digital sign-off" hint="Staff sign an acknowledgement at the end." checked={form.requireSignoff} onChange={(v) => setForm({ ...form, requireSignoff: v })} />
            <Toggle label="Issue a certificate" hint="Generate a PDF certificate on completion." checked={form.certificateEnabled} onChange={(v) => setForm({ ...form, certificateEnabled: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy}>Save settings</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!deleteSectionTarget}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={confirmDeleteSection}
        title="Delete section?"
        description={`"${deleteSectionTarget?.title ?? ""}" and all its lessons will be permanently removed.`}
        confirmLabel="Delete section"
        variant="danger"
        loading={busy}
      />
      <ConfirmDialog
        open={!!deleteLessonTarget}
        onClose={() => setDeleteLessonTarget(null)}
        onConfirm={confirmDeleteLesson}
        title="Delete lesson?"
        description={`"${deleteLessonTarget?.title ?? ""}" will be permanently removed.`}
        confirmLabel="Delete lesson"
        variant="danger"
        loading={busy}
      />
      <ConfirmDialog
        open={deleteCourseOpen}
        onClose={() => setDeleteCourseOpen(false)}
        onConfirm={confirmDeleteCourse}
        title="Delete course?"
        description="The course will be removed from staff and archived from view. Training records are preserved for compliance."
        confirmLabel="Delete course"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
