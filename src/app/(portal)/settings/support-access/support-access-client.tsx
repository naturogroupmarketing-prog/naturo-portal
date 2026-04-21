"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { updateSupportPolicy, revokeSupportSession } from "@/app/actions/support";
import type { SupportAccessLevel } from "@/generated/prisma/client";

interface Policy {
  supportAccessEnabled: boolean;
  requireApproval: boolean;
  defaultAccessLevel: SupportAccessLevel;
  sessionDurationMinutes: number;
  notifyOnEntry: boolean;
  notifyOnImpersonation: boolean;
  emergencyAccessEnabled: boolean;
}

interface SupportSession {
  id: string;
  agentName: string;
  agentEmail: string;
  accessLevel: string;
  status: string;
  startedAt: string | Date;
  endedAt?: string | Date | null;
  expiresAt: string | Date;
  endReason?: string | null;
  writeAttempts: number;
  approvedByAdmin: boolean;
  impersonatingUserEmail?: string | null;
  pagesVisited?: string[];
  notes?: string | null;
}

interface SupportRequest {
  id: string;
  agentName: string;
  agentEmail: string;
  accessLevel: string;
  status: string;
  reason: string;
  createdAt: string | Date;
  approvedAt?: string | Date | null;
  deniedAt?: string | Date | null;
  statusNote?: string | null;
  sessionDurationMinutes: number;
}

interface Props {
  policy: Policy;
  sessions: SupportSession[];
  requests: SupportRequest[];
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
];

const ACCESS_LEVEL_OPTIONS: { value: SupportAccessLevel; label: string; description: string }[] = [
  {
    value: "DIAGNOSTICS",
    label: "Diagnostics only",
    description: "Support can view technical diagnostics (errors, logs, environment) but cannot enter your workspace.",
  },
  {
    value: "READONLY",
    label: "Read-only workspace",
    description: "Support can view your dashboard, assets, staff, and settings — but cannot create, edit, or delete anything.",
  },
  {
    value: "IMPERSONATION",
    label: "Read-only + approve impersonation",
    description: "You grant support read-only access by default. Impersonation (acting as a user) requires your separate approval each time.",
  },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-action-500 ${checked ? "bg-action-500" : "bg-shark-200 dark:bg-shark-600"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-shark-100 dark:border-shark-700 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-shark-900 dark:text-shark-100">{title}</p>
        <p className="text-xs text-shark-500 dark:text-shark-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    ENDED: "bg-shark-100 text-shark-500 dark:bg-shark-700 dark:text-shark-400",
    EXPIRED: "bg-shark-100 text-shark-400",
    REVOKED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    APPROVED: "bg-emerald-100 text-emerald-700",
    DENIED: "bg-red-100 text-red-600",
    CANCELLED: "bg-shark-100 text-shark-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[status] ?? "bg-shark-100 text-shark-500"}`}>
      {status}
    </span>
  );
}

export function SupportAccessClient({ policy: initialPolicy, sessions, requests }: Props) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [policy, setPolicy] = useState<Policy>(initialPolicy);
  const [activeTab, setActiveTab] = useState<"settings" | "history" | "requests">("settings");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const activeSessions = sessions.filter((s) => s.status === "ACTIVE");

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSupportPolicy(policy);
      if ("error" in result) {
        addToast(result.error ?? "Failed to save", "error");
      } else {
        addToast("Support access settings saved", "success");
      }
    });
  };

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    const result = await revokeSupportSession(sessionId);
    setRevokingId(null);
    if ("error" in result) {
      addToast(result.error ?? "Failed to revoke", "error");
    } else {
      addToast("Session revoked", "success");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Support Access</h1>
        <p className="mt-1 text-sm text-shark-500 dark:text-shark-400">
          Control when and how Trackio support can access your account to help diagnose issues.
        </p>
      </div>

      {/* Active session alert */}
      {activeSessions.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
          <Icon name="alert-triangle" size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {activeSessions.length} active support session{activeSessions.length > 1 ? "s" : ""}
            </p>
            <div className="mt-1 space-y-1">
              {activeSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {s.agentName} ({s.accessLevel}) — expires {new Date(s.expiresAt).toLocaleTimeString("en-AU")}
                  </p>
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={revokingId === s.id}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {revokingId === s.id ? "Revoking…" : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-shark-100 dark:bg-shark-800 rounded-xl p-1">
        {(["settings", "history", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? "bg-white dark:bg-shark-700 text-shark-900 dark:text-shark-100 shadow-sm"
                : "text-shark-500 hover:text-shark-700 dark:hover:text-shark-300"
            }`}
          >
            {tab === "history" ? "Session History" : tab === "requests" ? `Requests${requests.filter(r => r.status === "PENDING").length ? ` (${requests.filter(r => r.status === "PENDING").length})` : ""}` : "Settings"}
          </button>
        ))}
      </div>

      {/* ── Settings Tab ── */}
      {activeTab === "settings" && (
        <Card className="overflow-hidden border-shark-200 dark:border-shark-700">
          <div className="px-6 py-5 border-b border-shark-100 dark:border-shark-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-shark-900 dark:text-shark-100">Support Access Settings</h2>
              <p className="text-xs text-shark-500 dark:text-shark-400 mt-0.5">Configure when and how Trackio support can access your account</p>
            </div>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${policy.supportAccessEnabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
              {policy.supportAccessEnabled ? "Access enabled" : "Access disabled"}
            </div>
          </div>

          <div className="px-6 divide-y divide-shark-50 dark:divide-shark-800">
            <SettingRow
              title="Allow Trackio Support Access"
              description="When disabled, Trackio support staff cannot enter your workspace under any circumstances. Emergency access notifications will still be sent to Trackio."
            >
              <Toggle
                checked={policy.supportAccessEnabled}
                onChange={(v) => setPolicy((p) => ({ ...p, supportAccessEnabled: v }))}
                label="Allow support access"
              />
            </SettingRow>

            <SettingRow
              title="Require Approval for Every Session"
              description="When enabled, support must request access and you must approve it before they can enter. You'll receive an in-app notification and email with the details."
            >
              <Toggle
                checked={policy.requireApproval}
                onChange={(v) => setPolicy((p) => ({ ...p, requireApproval: v }))}
                label="Require approval"
              />
            </SettingRow>

            <SettingRow
              title="Default Access Level"
              description="What level of access support is granted by default when they enter your account."
            >
              <select
                value={policy.defaultAccessLevel}
                onChange={(e) => setPolicy((p) => ({ ...p, defaultAccessLevel: e.target.value as SupportAccessLevel }))}
                className="text-xs border border-shark-200 dark:border-shark-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-shark-800 text-shark-700 dark:text-shark-300"
              >
                {ACCESS_LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </SettingRow>

            {/* Access level explanation */}
            <div className="py-4 space-y-2.5">
              {ACCESS_LEVEL_OPTIONS.map((o) => (
                <div
                  key={o.value}
                  className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                    policy.defaultAccessLevel === o.value
                      ? "border-action-200 bg-action-50 dark:bg-action-900/20 dark:border-action-700/40"
                      : "border-shark-100 dark:border-shark-700 opacity-60"
                  }`}
                >
                  <Icon
                    name={o.value === "DIAGNOSTICS" ? "search" : o.value === "READONLY" ? "shield" : "user"}
                    size={14}
                    className={policy.defaultAccessLevel === o.value ? "text-action-600 mt-0.5 shrink-0" : "text-shark-400 mt-0.5 shrink-0"}
                  />
                  <div>
                    <p className="text-xs font-semibold text-shark-800 dark:text-shark-200">{o.label}</p>
                    <p className="text-xs text-shark-500 dark:text-shark-400 mt-0.5">{o.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <SettingRow
              title="Maximum Session Duration"
              description="Support sessions auto-expire after this time. They cannot extend it beyond what you set here."
            >
              <select
                value={policy.sessionDurationMinutes}
                onChange={(e) => setPolicy((p) => ({ ...p, sessionDurationMinutes: Number(e.target.value) }))}
                className="text-xs border border-shark-200 dark:border-shark-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-shark-800 text-shark-700 dark:text-shark-300"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </SettingRow>

            <SettingRow
              title="Notify when support enters account"
              description="Send an in-app notification and email to account admins when a support session begins."
            >
              <Toggle
                checked={policy.notifyOnEntry}
                onChange={(v) => setPolicy((p) => ({ ...p, notifyOnEntry: v }))}
                label="Notify on entry"
              />
            </SettingRow>

            <SettingRow
              title="Notify when support impersonates a user"
              description="Send an additional alert when support uses impersonation mode to act as one of your users."
            >
              <Toggle
                checked={policy.notifyOnImpersonation}
                onChange={(v) => setPolicy((p) => ({ ...p, notifyOnImpersonation: v }))}
                label="Notify on impersonation"
              />
            </SettingRow>

            <SettingRow
              title="Allow Emergency Access"
              description="In rare security-critical situations, Trackio may need to access your account without waiting for approval. This is always logged, always notified, and reserved for genuine emergencies only."
            >
              <Toggle
                checked={policy.emergencyAccessEnabled}
                onChange={(v) => setPolicy((p) => ({ ...p, emergencyAccessEnabled: v }))}
                label="Emergency access"
              />
            </SettingRow>
          </div>

          <div className="px-6 py-4 bg-shark-50 dark:bg-shark-800/60 border-t border-shark-100 dark:border-shark-700 flex items-center justify-between">
            <p className="text-xs text-shark-400 dark:text-shark-500 flex items-center gap-1.5">
              <Icon name="shield" size={12} />
              All support sessions are fully audited and immutably logged.
            </p>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold bg-action-500 hover:bg-action-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? "Saving…" : "Save settings"}
            </button>
          </div>
        </Card>
      )}

      {/* ── Session History Tab ── */}
      {activeTab === "history" && (
        <Card className="overflow-hidden border-shark-200 dark:border-shark-700">
          <div className="px-6 py-4 border-b border-shark-100 dark:border-shark-700">
            <h2 className="text-base font-semibold text-shark-900 dark:text-shark-100">Support Session History</h2>
            <p className="text-xs text-shark-500 dark:text-shark-400 mt-0.5">Immutable log of all support access to your account</p>
          </div>
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Icon name="shield" size={32} className="text-shark-200 mx-auto mb-3" />
              <p className="text-sm text-shark-400">No support sessions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-shark-100 dark:divide-shark-700">
              {sessions.map((s) => (
                <div key={s.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-shark-900 dark:text-shark-100">{s.agentName}</span>
                        <StatusBadge status={s.status} />
                        <span className="text-xs text-shark-400 font-mono">{s.accessLevel}</span>
                        {s.impersonatingUserEmail && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            as {s.impersonatingUserEmail}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <p className="text-xs text-shark-500">
                          Started {new Date(s.startedAt).toLocaleString("en-AU")}
                        </p>
                        {s.endedAt && (
                          <p className="text-xs text-shark-400">
                            Ended {new Date(s.endedAt).toLocaleString("en-AU")}
                            {s.endReason && ` (${s.endReason})`}
                          </p>
                        )}
                        {s.writeAttempts > 0 && (
                          <p className="text-xs text-amber-600">
                            {s.writeAttempts} blocked write attempt{s.writeAttempts !== 1 ? "s" : ""}
                          </p>
                        )}
                        {s.approvedByAdmin && (
                          <p className="text-xs text-emerald-600">Approved by admin</p>
                        )}
                      </div>
                    </div>
                    {s.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevoke(s.id)}
                        disabled={revokingId === s.id}
                        className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        {revokingId === s.id ? "Revoking…" : "Revoke"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Requests Tab ── */}
      {activeTab === "requests" && (
        <Card className="overflow-hidden border-shark-200 dark:border-shark-700">
          <div className="px-6 py-4 border-b border-shark-100 dark:border-shark-700">
            <h2 className="text-base font-semibold text-shark-900 dark:text-shark-100">Support Access Requests</h2>
            <p className="text-xs text-shark-500 dark:text-shark-400 mt-0.5">
              Requests from Trackio support to access your account. Approve or deny from here when approval is required.
            </p>
          </div>
          {requests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Icon name="inbox" size={32} className="text-shark-200 mx-auto mb-3" />
              <p className="text-sm text-shark-400">No access requests</p>
            </div>
          ) : (
            <div className="divide-y divide-shark-100 dark:divide-shark-700">
              {requests.map((r) => (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-shark-900 dark:text-shark-100">{r.agentName}</span>
                        <StatusBadge status={r.status} />
                        <span className="text-xs font-mono text-shark-400">{r.accessLevel}</span>
                        <span className="text-xs text-shark-400">{r.sessionDurationMinutes}min</span>
                      </div>
                      <p className="text-xs text-shark-600 dark:text-shark-300 mt-1 italic">&ldquo;{r.reason}&rdquo;</p>
                      <p className="text-xs text-shark-400 mt-0.5">
                        Requested {new Date(r.createdAt).toLocaleString("en-AU")}
                      </p>
                    </div>
                    {r.status === "PENDING" && (
                      <div className="shrink-0 flex gap-2">
                        <ApproveRequestButton requestId={r.id} action="APPROVE" />
                        <ApproveRequestButton requestId={r.id} action="DENY" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* What support can and cannot do */}
      <Card className="border-shark-200 dark:border-shark-700">
        <div className="px-6 py-4 border-b border-shark-100 dark:border-shark-700">
          <h3 className="text-sm font-semibold text-shark-800 dark:text-shark-200">What Trackio support can and cannot do</h3>
        </div>
        <div className="px-6 py-4 grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
              <Icon name="check-circle" size={13} /> Can do (Read-only mode)
            </p>
            <ul className="space-y-1 text-xs text-shark-600 dark:text-shark-400">
              {["View your dashboard and health metrics","Browse asset and consumable records","Read staff assignments and activity logs","Check inventory levels and purchase orders","Review settings and permission configuration","Diagnose technical errors and failed requests"].map((item) => (
                <li key={item} className="flex gap-1.5"><span className="text-emerald-500 mt-px">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
              <Icon name="x" size={13} /> Cannot do (blocked by system)
            </p>
            <ul className="space-y-1 text-xs text-shark-600 dark:text-shark-400">
              {["Create, edit or delete any records","Assign or reassign assets or consumables","Approve or reject purchase orders","Change settings or permissions","Access passwords or payment details","Act as your users without explicit approval"].map((item) => (
                <li key={item} className="flex gap-1.5"><span className="text-red-400 mt-px">✗</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ApproveRequestButton({ requestId, action }: { requestId: string; action: "APPROVE" | "DENY" }) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/support/access-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        addToast(action === "APPROVE" ? "Access approved" : "Access denied", action === "APPROVE" ? "success" : "info");
      } else {
        addToast("Failed to update request", "error");
      }
    });
  };

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        action === "APPROVE"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {isPending ? "…" : action === "APPROVE" ? "Approve" : "Deny"}
    </button>
  );
}
