import type { RaidItem, BudgetLine, TaskItem, FollowupItem } from "./types";
import { isOverdue } from "./utils";

export interface SmartAlert {
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}

const DAYS = 24 * 60 * 60 * 1000;

/**
 * Instant, client-side, rule-based scan — runs on every page load with zero
 * network calls and zero AI cost. This is the "proactive" layer that's
 * always on; "Run AI Health Check" is the deeper, on-demand layer on top.
 */
export function computeSmartAlerts(data: {
  raid: RaidItem[];
  budget: BudgetLine[];
  tasks: TaskItem[];
  followups: FollowupItem[];
}): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = Date.now();

  const overdueTasks = data.tasks.filter((t) => isOverdue(t.dueDate, t.status));
  if (overdueTasks.length > 0) {
    alerts.push({
      severity: overdueTasks.length >= 3 ? "critical" : "warning",
      title: `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`,
      detail: overdueTasks.slice(0, 3).map((t) => t.title || "Untitled task").join(", "),
    });
  }

  const overdueFollowups = data.followups.filter((f) => isOverdue(f.dueDate, f.status));
  if (overdueFollowups.length > 0) {
    alerts.push({
      severity: "warning",
      title: `${overdueFollowups.length} overdue follow-up${overdueFollowups.length === 1 ? "" : "s"}`,
      detail: overdueFollowups.slice(0, 3).map((f) => f.title || "Untitled follow-up").join(", "),
    });
  }

  const unmitigated = data.raid.filter(
    (r) =>
      /open|mitigating/i.test(r.status) &&
      /high|critical/i.test(r.impact) &&
      !r.mitigation?.trim()
  );
  for (const r of unmitigated.slice(0, 3)) {
    alerts.push({
      severity: "critical",
      title: `No mitigation captured: "${r.title || "Untitled"}"`,
      detail: `${r.impact} impact ${r.category?.toLowerCase() || "item"} has no mitigation or response plan logged.`,
    });
  }

  const stale = data.raid.filter((r) => {
    if (!/open/i.test(r.status)) return false;
    const updated = new Date(r.updatedAt || r.createdAt).getTime();
    return now - updated > 14 * DAYS;
  });
  if (stale.length > 0) {
    alerts.push({
      severity: "info",
      title: `${stale.length} RAID item${stale.length === 1 ? "" : "s"} untouched for 14+ days`,
      detail: stale.slice(0, 3).map((r) => r.title || "Untitled").join(", "),
    });
  }

  const byCategory = new Map<string, { planned: number; actual: number }>();
  for (const b of data.budget) {
    const key = b.category || "Uncategorized";
    const entry = byCategory.get(key) ?? { planned: 0, actual: 0 };
    entry.planned += Number(b.plannedAmount) || 0;
    entry.actual += Number(b.actualAmount) || 0;
    byCategory.set(key, entry);
  }
  for (const [category, { planned, actual }] of byCategory) {
    if (planned > 0 && actual > planned) {
      const pct = Math.round(((actual - planned) / planned) * 100);
      alerts.push({
        severity: pct >= 20 ? "critical" : "warning",
        title: `${category} is over plan by ${pct}%`,
        detail: `Actual spend has exceeded the planned amount for this category.`,
      });
    }
  }

  const severityRank = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
