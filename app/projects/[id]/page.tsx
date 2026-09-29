"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ScanEye, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, isOverdue, newId, nowIso } from "@/lib/utils";
import BudgetChart from "@/components/BudgetChart";
import StatusDot from "@/components/StatusDot";
import HealthCheckModal from "@/components/HealthCheckModal";
import type { RateLimitInfo } from "@/components/QuotaBadge";
import type { HealthCheckItem } from "@/lib/types";
import { logAiAction, markAiActionAccepted, useAiStats } from "@/lib/aiActions";

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const project = useLiveQuery(() => db.projects.get(id), [id]);
  const scope = useLiveQuery(() => db.scopeItems.where("projectId").equals(id).toArray(), [id]) ?? [];
  const raid = useLiveQuery(() => db.raidItems.where("projectId").equals(id).toArray(), [id]) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where("projectId").equals(id).toArray(), [id]) ?? [];
  const budget = useLiveQuery(() => db.budgetLines.where("projectId").equals(id).toArray(), [id]) ?? [];
  const logs = useLiveQuery(() => db.logs.where("projectId").equals(id).reverse().sortBy("date"), [id]) ?? [];
  const followups = useLiveQuery(() => db.followups.where("projectId").equals(id).toArray(), [id]) ?? [];
  const aiStats = useAiStats(id);

  const [hcOpen, setHcOpen] = useState(false);
  const [hcLoading, setHcLoading] = useState(false);
  const [hcItems, setHcItems] = useState<HealthCheckItem[]>([]);
  const [hcError, setHcError] = useState<string | null>(null);
  const [hcRateLimit, setHcRateLimit] = useState<RateLimitInfo | null>(null);
  const [hcRateLimited, setHcRateLimited] = useState(false);

  if (!project) return null;

  const openRaid = raid.filter((r) => !/closed|mitigated|resolved/i.test(r.status));
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const overdueFollowups = followups.filter((f) => isOverdue(f.dueDate, f.status));
  const planned = budget.reduce((s, b) => s + (Number(b.plannedAmount) || 0), 0);
  const actual = budget.reduce((s, b) => s + (Number(b.actualAmount) || 0), 0);
  const doneTasks = tasks.filter((t) => /done/i.test(t.status)).length;

  const runHealthCheck = async () => {
    setHcOpen(true);
    setHcLoading(true);
    setHcItems([]);
    setHcError(null);
    setHcRateLimited(false);
    try {
      const res = await fetch("/api/ai/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, scope, raid, budget, tasks, followups }),
      });
      const data = await res.json();
      setHcRateLimit(data.rateLimit ?? null);
      if (res.status === 429) {
        setHcRateLimited(true);
        setHcError(data.error);
      } else if (!res.ok) {
        setHcError(data.error || "AI request failed.");
      } else {
        setHcItems(data.items ?? []);
        await logAiAction(id, "health-check");
      }
    } catch {
      setHcError("Something went wrong reaching the AI endpoint. Check your GROQ_API_KEY in .env.local.");
    } finally {
      setHcLoading(false);
    }
  };

  const addRaidFromHealthCheck = async (item: HealthCheckItem) => {
    const now = nowIso();
    await db.raidItems.add({
      id: newId(),
      projectId: id,
      category: item.raid?.category || "Risk",
      title: item.raid?.title || item.title,
      description: item.raid?.description || item.detail,
      owner: "",
      impact: item.raid?.impact || "Medium",
      probability: item.raid?.probability || "Medium",
      status: "Open",
      dateRaised: now.slice(0, 10),
      targetDate: "",
      mitigation: item.raid?.mitigation || "",
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
    await markAiActionAccepted(id, "health-check");
  };

  const addFollowupFromHealthCheck = async (item: HealthCheckItem) => {
    const now = nowIso();
    await db.followups.add({
      id: newId(),
      projectId: id,
      taskId: "",
      title: item.followup?.title || item.title,
      notes: item.followup?.notes || item.detail,
      owner: "",
      status: "Pending",
      dueDate: "",
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
    await markAiActionAccepted(id, "health-check");
  };

  return (
    <div>
      <div className="rounded-lg border border-signal-violet/25 bg-gradient-to-r from-signal-violet/10 to-transparent p-4 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-signal-violet/15 border border-signal-violet/30 flex items-center justify-center shrink-0">
            <ScanEye size={16} className="text-signal-violet" />
          </div>
          <div>
            <div className="text-sm font-medium text-ink">AI Health Check</div>
            <div className="text-xs text-ink-muted">
              Proactively scans scope, RAID, budget, tasks &amp; follow-ups together for gaps you haven't logged yet.
            </div>
          </div>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={hcLoading}
          className="shrink-0 flex items-center gap-2 bg-signal-violet text-base font-semibold text-sm px-4 py-2.5 rounded-md hover:brightness-110 transition-all disabled:opacity-50"
        >
          {hcLoading ? <Loader2 size={14} className="animate-spin" /> : <ScanEye size={14} />}
          Run health check
        </button>
      </div>

      {aiStats.totalActions > 0 && (
        <div className="text-[11px] text-ink-faint font-mono mb-4">
          AI impact on this project: {aiStats.totalActions} AI action{aiStats.totalActions === 1 ? "" : "s"} ·{" "}
          {aiStats.totalAccepted} suggestion{aiStats.totalAccepted === 1 ? "" : "s"} accepted · ~{aiStats.totalHours}h saved
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="rounded-lg border border-base-border bg-base-surface/60 p-5">
            <h3 className="text-sm font-semibold text-ink mb-1">Description</h3>
            <p className="text-ink-muted text-sm leading-relaxed">{project.description || "No description added yet."}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Budget</h3>
            <BudgetChart lines={budget} currency={project.currency} />
          </div>

          <div className="rounded-lg border border-base-border bg-base-surface/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Recent log activity</h3>
              <Link href={`/projects/${id}/logs`} className="text-xs text-signal-cyan hover:underline">View all</Link>
            </div>
            {logs.length === 0 && <p className="text-ink-faint text-sm">Nothing logged yet.</p>}
            <div className="flex flex-col gap-3">
              {logs.slice(0, 5).map((l) => (
                <div key={l.id} className="flex gap-3 text-sm">
                  <span className="text-ink-faint font-mono text-xs w-20 shrink-0 pt-0.5">{formatDate(l.date)}</span>
                  <div className="min-w-0">
                    <div className="text-ink font-medium truncate">{l.title || "(untitled)"}</div>
                    <div className="text-ink-muted text-xs truncate">{l.type} {l.author && `· ${l.author}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <QuickStat label="Open RAID items" value={openRaid.length} href={`/projects/${id}/raid`} warn={openRaid.length > 0} />
          <QuickStat label="Overdue tasks" value={overdueTasks.length} href={`/projects/${id}/tasks`} warn={overdueTasks.length > 0} />
          <QuickStat label="Overdue follow-ups" value={overdueFollowups.length} href={`/projects/${id}/followups`} warn={overdueFollowups.length > 0} />
          <QuickStat label="Tasks completed" value={`${doneTasks} / ${tasks.length}`} href={`/projects/${id}/tasks`} />
          <QuickStat
            label="Budget committed"
            value={planned ? `${Math.min(100, Math.round((actual / planned) * 100))}%` : "—"}
            href={`/projects/${id}/budget`}
            warn={planned > 0 && actual > planned}
          />
          <div className="rounded-lg border border-base-border bg-base-surface/60 p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-faint mb-2">Top open risks</div>
            {openRaid.length === 0 && <p className="text-ink-faint text-xs">None logged.</p>}
            <div className="flex flex-col gap-2">
              {openRaid.slice(0, 4).map((r) => (
                <div key={r.id} className="text-xs">
                  <StatusDot value={r.impact} />
                  <span className="text-ink-muted ml-1">{r.title || "(untitled)"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-base-border bg-base-surface/60 p-4 text-xs text-ink-faint">
            <div className="font-mono">{formatCurrency(actual, project.currency)} spent</div>
            <div className="font-mono">{formatCurrency(planned, project.currency)} planned</div>
          </div>
        </div>
      </div>

      {hcOpen && (
        <HealthCheckModal
          loading={hcLoading}
          items={hcItems}
          error={hcError}
          isRateLimited={hcRateLimited}
          rateLimit={hcRateLimit}
          onAddRaid={addRaidFromHealthCheck}
          onAddFollowup={addFollowupFromHealthCheck}
          onClose={() => setHcOpen(false)}
        />
      )}
    </div>
  );
}

function QuickStat({ label, value, href, warn }: { label: string; value: string | number; href: string; warn?: boolean }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-base-border bg-base-surface/60 p-4 flex items-center justify-between hover:border-signal-cyan/40 transition-colors"
    >
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`font-mono text-lg font-semibold ${warn ? "text-signal-amber" : "text-ink"}`}>{value}</span>
    </Link>
  );
}
