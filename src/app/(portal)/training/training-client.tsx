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
import { Icon, type IconName } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_OPTIONS,
  courseStatusBadge,
  type CourseStatusTone,
} from "@/lib/training";
import { createCourse } from "@/app/actions/training";

interface CourseListItem {
  id: string;
  title: string;
  description: string | null;
  category: CourseCategory;
  status: CourseStatus;
  coverImageUrl: string | null;
  isMandatory: boolean;
  estimatedMinutes: number | null;
  createdAt: string;
  _count: { sections: number; enrollments: number };
}

interface Stats {
  total: number;
  published: number;
  drafts: number;
  mandatory: number;
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

export function TrainingClient({
  courses,
  stats,
}: {
  courses: CourseListItem[];
  stats: Stats;
}) {
  const router = useRouter();
  const { addToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CourseCategory>("NEW_STAFF_INDUCTION");

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = courses.filter((c) => {
    if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    return true;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast("Please enter a course title", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("category", category);
      // Sensible defaults for the required boolean fields — editable later in settings.
      fd.set("isMandatory", "false");
      fd.set("requirePassToComplete", "false");
      fd.set("requireSignoff", "true");
      fd.set("certificateEnabled", "true");
      const res = await createCourse(fd);
      if (res?.success && res.courseId) {
        addToast("Course created", "success");
        router.push(`/training/${res.courseId}`);
        return;
      }
      setSaving(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not create course", "error");
      setSaving(false);
    }
  }

  const statCards: { label: string; value: number; icon: IconName; stripe: string }[] = [
    { label: "Courses", value: stats.total, icon: "graduation-cap", stripe: "border-t-action-500" },
    { label: "Published", value: stats.published, icon: "check-circle", stripe: "border-t-emerald-500" },
    { label: "Drafts", value: stats.drafts, icon: "edit", stripe: "border-t-shark-400" },
    { label: "Mandatory", value: stats.mandatory, icon: "shield", stripe: "border-t-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header — the page H1 ("Staff Induction & Training") is rendered by the breadcrumb bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-shark-500 dark:text-shark-400 max-w-xl">
          Build inductions, SOPs and safety courses, then assign and track them across your team.
        </p>
        <Button variant="primary" onClick={() => setCreateOpen(true)} className="shrink-0 self-start sm:self-auto">
          <Icon name="plus" size={18} className="mr-1.5" />
          New course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} padding="md" className={`border-t-2 ${s.stripe}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-shark-50 dark:bg-shark-800 flex items-center justify-center shrink-0">
                <Icon name={s.icon} size={20} className="text-shark-600 dark:text-shark-300" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-bold tabular-nums text-shark-900 dark:text-white leading-none">
                  {s.value}
                </p>
                <p className="text-sm text-shark-500 dark:text-shark-400 mt-1 truncate">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      {courses.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-56">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="ALL">All categories</option>
              {COURSE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
        </div>
      )}

      {/* Course grid */}
      {courses.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="graduation-cap"
            title="No courses yet"
            description="Create your first induction or training course to get started."
            action={{ label: "New course", onClick: () => setCreateOpen(true) }}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="funnel"
            title="No courses match"
            description="Try changing the category or status filter."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} href={`/training/${c.id}`} className="group block focus:outline-none">
              <Card
                padding="none"
                className="overflow-hidden h-full transition-shadow group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-focus-visible:ring-2 group-focus-visible:ring-action-500/40"
              >
                <div className="relative h-32 bg-shark-50 dark:bg-shark-800 flex items-center justify-center">
                  {c.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.coverImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name="graduation-cap" size={32} className="text-shark-300 dark:text-shark-600" />
                  )}
                  <span className="absolute top-3 right-3">
                    <StatusPill status={c.status} />
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-shark-500 dark:text-shark-400">
                    {COURSE_CATEGORY_LABELS[c.category]}
                  </p>
                  <h3 className="mt-1 text-base font-bold tracking-tight text-shark-900 dark:text-white line-clamp-2">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="mt-1 text-sm text-shark-500 dark:text-shark-400 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-shark-500 dark:text-shark-400">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="file-text" size={14} />
                      {c._count.sections} section{c._count.sections === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="users" size={14} />
                      {c._count.enrollments} enrolled
                    </span>
                    {c.isMandatory && (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Icon name="shield" size={14} />
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* New course modal */}
      <Modal open={createOpen} onClose={() => !saving && setCreateOpen(false)} title="New course">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Course title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Staff Induction"
              maxLength={200}
            />
          </FormField>
          <FormField label="Description" hint="A short summary staff will see.">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this course covers…"
              maxLength={5000}
              className="w-full rounded-[20px] border border-shark-200 dark:border-white/[0.10] bg-white dark:bg-shark-800 px-3.5 py-2.5 text-base sm:text-sm text-shark-900 dark:text-white focus:border-action-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500/20 transition-all min-h-[88px] resize-y"
            />
          </FormField>
          <FormField label="Category" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value as CourseCategory)}>
              {COURSE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Create course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
