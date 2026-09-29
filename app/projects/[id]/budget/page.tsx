"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { db } from "@/lib/db";
import { useBoard } from "@/lib/useBoard";
import DynamicTable, { type ColumnDef } from "@/components/DynamicTable";
import type { BudgetLine, BudgetInsightItem } from "@/lib/types";
import SectionHeader from "@/components/SectionHeader";
import BudgetChart from "@/components/BudgetChart";
import BudgetInsightsModal from "@/components/BudgetInsightsModal";
import type { RateLimitInfo } from "@/components/QuotaBadge";
import { formatCurrency, newId, nowIso } from "@/lib/utils";
import { logAiAction, markAiActionAccepted } from "@/lib/aiActions";
import { useLiveQuery } from "dexie-react-hooks";

const COLUMNS: ColumnDef[] = [
  { key: "category", label: "Category", type: "status", width: "w-32", suggestions: ["Labour", "Hardware", "Licensing", "Vendor / SI", "Contingency", "Training"] },
  { key: "description", label: "Description", type: "textarea", width: "w-64" },
  { key: "period", label: "Period", type: "text", width: "w-24" },
  { key: "plannedAmount", label: "Planned", type: "number", width: "w-28" },
  { key: "actualAmount", label: "Actual", type: "number", width: "w-28" },
  { key: "status", label: "Status", type: "status", width: "w-28", suggestions: ["Forecast", "Committed", "Invoiced", "Paid"] },
  { key: "notes", label: "Notes", type: "textarea", width: "w-56" },
];

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  const project = useLiveQuery(() => db.projects.get(id), [id]);
  const board = useBoard(db.budgetLines, id, "budget", (rid, projectId, now) => ({
    id: rid,
    projectId,
    category: "Labour",
    description: "",
    plannedAmount: 0,
    actualAmount: 0,
    period: "",
    status: "Forecast",
    notes: "",
    extra: {},
    createdAt: now,
    updatedAt: now,
  }));

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiItems, setAiItems] = useState<BudgetInsightItem[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const planned = board.rows.reduce((s: number, b: BudgetLine) => s + (Number(b.plannedAmount) || 0), 0);
  const actual = board.rows.reduce((s: number, b: BudgetLine) => s + (Number(b.actualAmount) || 0), 0);
  const variance = planned - actual;

  const runInsights = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiItems([]);
    setAiError(null);
    setIsRateLimited(false);
    try {
      const res = await fetch("/api/ai/budget-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project?.name,
          currency: project?.currency,
          lines: board.rows.map((r: BudgetLine) => ({
            category: r.category,
            description: r.description,
            planned: r.plannedAmount,
            actual: r.actualAmount,
            period: r.period,
            status: r.status,
          })),
        }),
      });
      const data = await res.json();
      setRateLimit(data.rateLimit ?? null);
      if (res.status === 429) {
        setIsRateLimited(true);
        setAiError(data.error);
      } else if (!res.ok) {
        setAiError(data.error || "AI request failed.");
      } else {
        setAiItems(data.items ?? []);
        await logAiAction(id, "budget-insight");
      }
    } catch {
      setAiError("Something went wrong reaching the AI endpoint. Check your GROQ_API_KEY in .env.local.");
    } finally {
      setAiLoading(false);
    }
  };

  const createFollowup = async (followup: { title: string; notes: string }) => {
    const now = nowIso();
    await db.followups.add({
      id: newId(),
      projectId: id,
      taskId: "",
      title: followup.title,
      notes: followup.notes,
      owner: "",
      status: "Pending",
      dueDate: "",
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
    await markAiActionAccepted(id, "budget-insight");
  };

  return (
    <div>
      <SectionHeader
        title="Budget Tracking"
        subtitle="Planned vs. actual spend by category — a running financial log for the project."
        onAi={runInsights}
        aiLabel="AI budget insights"
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <BudgetStat label="Planned" value={formatCurrency(planned, project?.currency)} />
        <BudgetStat label="Actual" value={formatCurrency(actual, project?.currency)} />
        <BudgetStat
          label={variance >= 0 ? "Remaining" : "Over budget"}
          value={formatCurrency(Math.abs(variance), project?.currency)}
          warn={variance < 0}
        />
      </div>

      <div className="mb-5">
        <BudgetChart lines={board.rows} currency={project?.currency ?? "USD"} />
      </div>

      <DynamicTable<BudgetLine>
        columns={COLUMNS}
        rows={board.rows}
        extraFields={board.extraFields}
        emptyLabel="No budget lines yet. Add categories like Labour, Hardware, Licensing…"
        addLabel="Add budget line"
        onAddRow={board.addRow}
        onUpdateRow={board.updateRow}
        onDeleteRow={board.deleteRow}
        onAddExtraField={board.addExtraField}
        onRemoveExtraField={board.removeExtraField}
      />

      {aiOpen && (
        <BudgetInsightsModal
          loading={aiLoading}
          items={aiItems}
          error={aiError}
          isRateLimited={isRateLimited}
          rateLimit={rateLimit}
          onCreateFollowup={createFollowup}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}

function BudgetStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-base-border bg-base-surface/60 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-faint mb-1">{label}</div>
      <div className={`font-mono text-lg font-semibold ${warn ? "text-signal-red" : "text-ink"}`}>{value}</div>
    </div>
  );
}
