"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  plan: string;
  subscriptionStatus: string;
  createdAt: string;
  activeSessionCount: number;
  _count: { users: number; assets: number; supportSessions: number };
  supportPolicy: {
    supportAccessEnabled: boolean;
    requireApproval: boolean;
    defaultAccessLevel: string;
    sessionDurationMinutes: number;
  };
}

interface TenantDiagnostics {
  org: { id: string; name: string; plan: string; subscriptionStatus: string; _count: Record<string, number> };
  policy: { supportAccessEnabled: boolean; requireApproval: boolean; defaultAccessLevel: string; sessionDurationMinutes: number };
  diagnostics: {
    openDamageReports: number;
    recentAuditEvents: { id: string; action: string; description: string; createdAt: string; performedBy: { name?: string; email: string; role: string } | null }[];
    staff: { id: string; name?: string | null; email: string; role: string; failedLoginAttempts: number; lockedUntil?: string | null }[];
  };
  sessions: {
    active: { id: string; agentName: string; accessLevel: string; startedAt: string; expiresAt: string }[];
    recent: { id: string; agentName: string; accessLevel: string; status: string; startedAt: string; endedAt?: string | null; endReason?: string | null }[];
  };
}

interface Props {
  agentRole: string;
  agentId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    FREE: "bg-shark-700 text-shark-300",
    ADMIN: "bg-blue-900/50 text-blue-300",
    PRO: "bg-action-900/50 text-action-300",
    ENTERPRISE: "bg-purple-900/50 text-purple-300",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${colors[plan] ?? "bg-shark-700 text-shark-400"}`}>
      {plan}
    </span>
  );
}

function AccessBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    DIAGNOSTICS: "bg-blue-900/40 text-blue-300",
    READONLY: "bg-amber-900/40 text-amber-300",
    IMPERSONATION: "bg-red-900/40 text-red-300",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${colors[level] ?? "bg-shark-700 text-shark-400"}`}>
      {level}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function SupportConsoleClient({ agentRole, agentId }: Props) {
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [diagnostics, setDiagnostics] = useState<TenantDiagnostics | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<"DIAGNOSTICS" | "READONLY" | "IMPERSONATION">("READONLY");
  type AccessLevel = "DIAGNOSTICS" | "READONLY" | "IMPERSONATION";
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [reason, setReason] = useState("");
  const [diagTab, setDiagTab] = useState<"overview" | "audit" | "staff" | "sessions" | "diagnostics">("overview");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionEvents, setSessionEvents] = useState<{ id: string; eventType: string; description: string; metadata: string | null; createdAt: string }[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const isSenior = agentRole === "TRACKIO_SUPPORT_SENIOR";

  // Search tenants
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length < 1) { setTenants([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/support/tenants?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setTenants(data.tenants ?? []);
        }
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Load diagnostics when tenant selected
  const loadDiagnostics = useCallback(async (orgId: string) => {
    setDiagLoading(true);
    setDiagnostics(null);
    try {
      const res = await fetch(`/api/support/tenants/${orgId}`);
      if (res.ok) setDiagnostics(await res.json());
    } finally { setDiagLoading(false); }
  }, []);

  const handleSelectTenant = (tenant: Tenant) => {
    setSelected(tenant);
    setSessionError(null);
    setSuccessMsg(null);
    loadDiagnostics(tenant.id);
  };

  const handleStartSession = async () => {
    if (!selected || !reason.trim()) { setSessionError("Please provide a reason for access"); return; }
    setStartingSession(true);
    setSessionError(null);

    const res = await fetch("/api/support/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: selected.id,
        accessLevel: selectedLevel,
        durationMinutes: selectedDuration,
        reason: reason.trim(),
      }),
    });

    const data = await res.json();
    setStartingSession(false);

    if (!res.ok) {
      if (data.requiresApproval) {
        // Auto-submit an access request
        const reqRes = await fetch("/api/support/access-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: selected.id,
            accessLevel: selectedLevel,
            reason: reason.trim(),
            sessionDurationMinutes: selectedDuration,
          }),
        });
        if (reqRes.ok) {
          setSuccessMsg("Access request submitted. The tenant admin will be notified to approve.");
        } else {
          setSessionError(data.error ?? "Failed to start session");
        }
        return;
      }
      setSessionError(data.error ?? "Failed to start session");
      return;
    }

    // Store token in cookie
    const maxAge = selectedDuration * 60;
    document.cookie = `trackio-support-session=${data.token}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
    setSuccessMsg(`Session started! You now have ${selectedLevel} access to ${selected.name} for ${selectedDuration} minutes.`);

    // Reload diagnostics
    loadDiagnostics(selected.id);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tenant Search</h1>
        <p className="text-sm text-white/50 mt-0.5">Find a client account to diagnose or access</p>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name, email, or tenant ID…"
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-action-500 focus:bg-white/8 transition-colors"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <svg className="animate-spin w-4 h-4 text-action-400" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
              <path d="M8 1.5a6.5 6.5 0 016.5 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Results */}
      {tenants.length > 0 && !selected && (
        <div className="grid gap-2">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant)}
              className="w-full text-left p-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{tenant.name}</span>
                    <PlanBadge plan={tenant.plan} />
                    {!tenant.supportPolicy.supportAccessEnabled && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">ACCESS DISABLED</span>
                    )}
                    {tenant.activeSessionCount > 0 && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded">
                        {tenant.activeSessionCount} ACTIVE SESSION{tenant.activeSessionCount > 1 ? "S" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-white/40">
                    <span>{tenant.email ?? "—"}</span>
                    <span>{tenant._count.users} users</span>
                    <span>{tenant._count.assets} assets</span>
                    {tenant.supportPolicy.requireApproval && <span className="text-amber-400">⚠ Requires approval</span>}
                  </div>
                </div>
                <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Selected tenant workspace ── */}
      {selected && (
        <div className="space-y-4">
          {/* Back + tenant header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelected(null); setDiagnostics(null); setSessionError(null); setSuccessMsg(null); }}
              className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              ← Back
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-bold text-white">{selected.name}</span>
              <PlanBadge plan={selected.plan} />
              {!selected.supportPolicy.supportAccessEnabled && (
                <span className="text-xs font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded">ACCESS DISABLED BY TENANT</span>
              )}
            </div>
          </div>

          {/* Success/error */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-sm text-emerald-300 flex gap-2">
              <span className="shrink-0">✓</span> {successMsg}
            </div>
          )}
          {sessionError && (
            <div className="p-3.5 rounded-xl bg-red-900/30 border border-red-700/50 text-sm text-red-300 flex gap-2">
              <span className="shrink-0">✗</span> {sessionError}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Left: access controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-white/50">Start Session</h3>

                {/* Access level */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Access level</label>
                  {(["DIAGNOSTICS", "READONLY", ...(isSenior ? ["IMPERSONATION"] : [])] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level as AccessLevel)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                        selectedLevel === level
                          ? "bg-action-500/20 border border-action-500/50 text-action-300"
                          : "bg-white/5 border border-transparent text-white/50 hover:text-white/70 hover:bg-white/8"
                      }`}
                    >
                      <div className="font-semibold">{level}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {level === "DIAGNOSTICS" && "View technical diagnostics only — no workspace access"}
                        {level === "READONLY" && "Enter workspace in strict read-only mode"}
                        {level === "IMPERSONATION" && "Act as a specific user to reproduce issues"}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">Duration</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 focus:outline-none focus:border-action-500"
                  >
                    {[15, 30, 60, 120].filter((d) => d <= (selected.supportPolicy.sessionDurationMinutes ?? 240)).map((d) => (
                      <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60}h`}</option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">Reason for access *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Client reports purchase orders not visible…"
                    rows={3}
                    className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-action-500"
                  />
                </div>

                {/* Policy warnings */}
                <div className="text-[10px] text-white/30 space-y-0.5">
                  {selected.supportPolicy.requireApproval && (
                    <p className="text-amber-400/70">⚠ This tenant requires admin approval</p>
                  )}
                  {!selected.supportPolicy.supportAccessEnabled && (
                    <p className="text-red-400/70">✗ Support access disabled by tenant</p>
                  )}
                  {(selected.supportPolicy as { notifyOnEntry?: boolean }).notifyOnEntry && (
                    <p>ℹ Tenant admin will be notified on entry</p>
                  )}
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={startingSession || !reason.trim() || (!selected.supportPolicy.supportAccessEnabled && selectedLevel !== "DIAGNOSTICS")}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-action-500 hover:bg-action-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  {startingSession ? "Starting…" : selected.supportPolicy.requireApproval ? "Request Access" : `Start ${selectedLevel} Session`}
                </button>
              </div>

              {/* Active sessions for this tenant */}
              {diagnostics?.sessions.active.length ? (
                <div className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-xl">
                  <p className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wide">Active Sessions</p>
                  {diagnostics.sessions.active.map((s) => (
                    <div key={s.id} className="text-xs text-white/60">
                      {s.agentName} · <AccessBadge level={s.accessLevel} /> · expires {new Date(s.expiresAt).toLocaleTimeString("en-AU")}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Right: diagnostics */}
            <div className="lg:col-span-2">
              {diagLoading ? (
                <div className="h-64 flex items-center justify-center text-white/30 text-sm">
                  Loading diagnostics…
                </div>
              ) : diagnostics ? (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Diag tabs */}
                  <div className="flex border-b border-white/10">
                    {(["overview", "audit", "staff", "sessions", "diagnostics"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDiagTab(t)}
                        className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors ${
                          diagTab === t
                            ? "text-white border-b-2 border-action-500"
                            : "text-white/40 hover:text-white/60"
                        }`}
                      >
                        {t === "audit" ? "Audit Log" : t === "sessions" ? "Session History" : t === "diagnostics" ? "Client Capture" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 max-h-[500px] overflow-y-auto">

                    {/* Overview */}
                    {diagTab === "overview" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries({
                          Users: diagnostics.org._count.users,
                          Assets: diagnostics.org._count.assets,
                          Consumables: diagnostics.org._count.consumables,
                          Regions: diagnostics.org._count.regions,
                          "Open Damage Reports": diagnostics.diagnostics.openDamageReports,
                          "Purchase Orders": diagnostics.org._count.purchaseOrders,
                        }).map(([label, val]) => (
                          <div key={label} className="bg-white/5 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
                            <p className="text-xl font-bold text-white mt-0.5">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Audit log */}
                    {diagTab === "audit" && (
                      <div className="space-y-2">
                        {diagnostics.diagnostics.recentAuditEvents.length === 0 ? (
                          <p className="text-xs text-white/30 text-center py-8">No audit events</p>
                        ) : diagnostics.diagnostics.recentAuditEvents.map((e) => (
                          <div key={e.id} className="text-xs border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-action-400">{e.action}</span>
                              <span className="text-white/30">{new Date(e.createdAt).toLocaleTimeString("en-AU")}</span>
                              {e.performedBy && (
                                <span className="text-white/40">{e.performedBy.name ?? e.performedBy.email}</span>
                              )}
                            </div>
                            <p className="text-white/60 mt-0.5 truncate">{e.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Staff */}
                    {diagTab === "staff" && (
                      <div className="space-y-2">
                        {diagnostics.diagnostics.staff.map((u) => (
                          <div key={u.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                            <div>
                              <span className="text-white/80">{u.name ?? u.email}</span>
                              <span className="ml-2 text-white/30 font-mono text-[10px]">{u.role}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/40">
                              {u.failedLoginAttempts > 0 && (
                                <span className="text-amber-400">{u.failedLoginAttempts} failed logins</span>
                              )}
                              {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                                <span className="text-red-400">Locked</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Session history */}
                    {diagTab === "sessions" && (
                      <div className="space-y-2">
                        {diagnostics.sessions.recent.length === 0 ? (
                          <p className="text-xs text-white/30 text-center py-8">No past sessions</p>
                        ) : diagnostics.sessions.recent.map((s) => (
                          <div key={s.id} className="text-xs border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white/70">{s.agentName}</span>
                              <AccessBadge level={s.accessLevel} />
                              <span className={`text-[10px] font-semibold ${s.status === "ACTIVE" ? "text-emerald-400" : s.status === "REVOKED" ? "text-red-400" : "text-white/30"}`}>
                                {s.status}
                              </span>
                            </div>
                            <p className="text-white/30 mt-0.5">
                              {new Date(s.startedAt).toLocaleString("en-AU")}
                              {s.endedAt && ` → ${new Date(s.endedAt).toLocaleString("en-AU")}`}
                              {s.endReason && ` (${s.endReason})`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Client-side diagnostics capture viewer */}
                    {diagTab === "diagnostics" && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-white/30 uppercase tracking-wide">Select a session to view captured client events</p>
                        {/* Session picker */}
                        <div className="space-y-1">
                          {diagnostics.sessions.recent.length === 0 ? (
                            <p className="text-xs text-white/30 text-center py-6">No sessions yet</p>
                          ) : diagnostics.sessions.recent.map((s) => (
                            <button
                              key={s.id}
                              onClick={async () => {
                                setSelectedSessionId(s.id);
                                setEventsLoading(true);
                                setSessionEvents([]);
                                try {
                                  const r = await fetch(`/api/support/diagnostics?sessionId=${s.id}`);
                                  if (r.ok) {
                                    const d = await r.json();
                                    setSessionEvents(d.events ?? []);
                                  }
                                } finally { setEventsLoading(false); }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedSessionId === s.id ? "bg-action-500/20 border border-action-500/40 text-action-300" : "bg-white/5 border border-transparent text-white/50 hover:bg-white/8 hover:text-white/70"}`}
                            >
                              <span className="font-medium">{s.agentName}</span>
                              <span className="ml-2 opacity-50">{new Date(s.startedAt).toLocaleString("en-AU")}</span>
                              <AccessBadge level={s.accessLevel} />
                            </button>
                          ))}
                        </div>

                        {/* Events list */}
                        {selectedSessionId && (
                          <div className="border-t border-white/10 pt-3">
                            {eventsLoading ? (
                              <p className="text-xs text-white/30 text-center py-4">Loading events…</p>
                            ) : sessionEvents.length === 0 ? (
                              <p className="text-xs text-white/30 text-center py-4">No captured events for this session</p>
                            ) : (
                              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                {sessionEvents.map((ev) => {
                                  const typeColors: Record<string, string> = {
                                    error: "text-red-400",
                                    rejection: "text-orange-400",
                                    console_error: "text-amber-400",
                                    navigation: "text-blue-400",
                                  };
                                  return (
                                    <div key={ev.id} className="text-[10px] border-b border-white/5 pb-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold uppercase ${typeColors[ev.eventType] ?? "text-white/40"}`}>{ev.eventType}</span>
                                        <span className="text-white/20">{new Date(ev.createdAt).toLocaleTimeString("en-AU")}</span>
                                      </div>
                                      <p className="text-white/60 truncate mt-0.5">{ev.description}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selected && tenants.length === 0 && !loading && (
        <div className="text-center py-16 text-white/20">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">Search for a client account above to begin</p>
        </div>
      )}
    </div>
  );
}
