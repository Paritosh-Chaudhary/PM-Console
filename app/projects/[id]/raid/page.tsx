"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { db } from "@/lib/db";
import { useBoard } from "@/lib/useBoard";
import DynamicTable, { type ColumnDef } from "@/components/DynamicTable";
import type { RaidItem, RaidSuggestionItem } from "@/lib/types";
import RaidSuggestionsModal from "@/components/RaidSuggestionsModal";
import type { RateLimitInfo } from "@/components/QuotaBadge";
import SectionHeader from "@/components/SectionHeader";
import { logAiAction, markAiActionAccepted } from "@/lib/aiActions";
import { newId, nowIso } from "@/lib/utils";

const COLUMNS: ColumnDef[] = [
  { key: "category", label: "Category", type: "status", width: "w-28", suggestions: ["Risk", "Assumption", "Issue", "Dependency"] },
  { key: "title", label: "Title", type: "text", width: "w-48" },
  { key: "description", label: "Description", type: "textarea", width: "w-64" },
  { key: "owner", label: "Owner", type: "text", width: "w-28" },
  { key: "impact", label: "Impact", type: "status", width: "w-24", suggestions: ["Low", "Medium", "High", "Critical"] },
  { key: "probability", label: "Probability", type: "status", width: "w-24", suggestions: ["Low", "Medium", "High"] },
  { key: "status", label: "Status", type: "status", width: "w-28", suggestions: ["Open", "Mitigating", "Closed", "Realized"] },
  { key: "dateRaised", label: "Raised", type: "date", width: "w-32" },
  { key: "targetDate", label: "Target", type: "date", width: "w-32" },
  { key: "mitigation", label: "Mitigation / Response", type: "textarea", width: "w-64" },
];

export default function RaidPage() {
  const { id } = useParams<{ id: string }>();
  const board = useBoard(db.raidItems, id, "raid", (rid, projectId, now) => ({
    id: rid,
    projectId,
    category: "Risk",
    title: "",
    description: "",
    owner: "",
    impact: "Medium",
    probability: "Medium",
    status: "Open",
    dateRaised: now.slice(0, 10),
    targetDate: "",
    mitigation: "",
    extra: {},
    createdAt: now,
    updatedAt: now,
  }));

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiItems, setAiItems] = useState<RaidSuggestionItem[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const runAiSuggest = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiItems([]);
    setAiError(null);
    setIsRateLimited(false);
    try {
      const project = await db.projects.get(id);
      const res = await fetch("/api/ai/suggest-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project?.name,
          description: project?.description,
          network: project?.network,
          existing: board.rows.map((r: RaidItem) => `${r.category}: ${r.title}`),
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
        await logAiAction(id, "raid-suggest");
      }
    } catch {
      setAiError("Something went wrong reaching the AI endpoint. Check your GROQ_API_KEY in .env.local.");
    } finally {
      setAiLoading(false);
    }
  };

  const addSuggestion = async (item: RaidSuggestionItem) => {
    const now = nowIso();
    await db.raidItems.add({
      id: newId(),
      projectId: id,
      category: item.category || "Risk",
      title: item.title || "",
      description: item.description || "",
      owner: "",
      impact: item.impact || "Medium",
      probability: item.probability || "Medium",
      status: "Open",
      dateRaised: now.slice(0, 10),
      targetDate: "",
      mitigation: item.mitigation || "",
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
    await markAiActionAccepted(id, "raid-suggest");
  };

  return (
    <div>
      <SectionHeader
        title="RAID Log"
        subtitle="Risks, Assumptions, Issues & Dependencies — one running log, fully editable."
        onAi={runAiSuggest}
        aiLabel="Suggest risks with AI"
      />
      <DynamicTable<RaidItem>
        columns={COLUMNS}
        rows={board.rows}
        extraFields={board.extraFields}
        emptyLabel="No RAID entries yet. Add a risk, assumption, issue or dependency below."
        addLabel="Add RAID entry"
        onAddRow={board.addRow}
        onUpdateRow={board.updateRow}
        onDeleteRow={board.deleteRow}
        onAddExtraField={board.addExtraField}
        onRemoveExtraField={board.removeExtraField}
      />
      {aiOpen && (
        <RaidSuggestionsModal
          loading={aiLoading}
          items={aiItems}
          error={aiError}
          isRateLimited={isRateLimited}
          rateLimit={rateLimit}
          onAdd={addSuggestion}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}
