"use client";

import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { useBoard } from "@/lib/useBoard";
import DynamicTable, { type ColumnDef } from "@/components/DynamicTable";
import type { ScopeItem } from "@/lib/types";
import SectionHeader from "@/components/SectionHeader";

const COLUMNS: ColumnDef[] = [
  { key: "category", label: "Type", type: "status", width: "w-32", suggestions: ["Objective", "Deliverable", "Milestone", "Exclusion", "Assumption"] },
  { key: "title", label: "Title", type: "text", width: "w-56" },
  { key: "description", label: "Detail", type: "textarea", width: "w-80" },
  { key: "status", label: "Status", type: "status", width: "w-32", suggestions: ["Not started", "In progress", "Delivered", "Descoped"] },
  { key: "dueDate", label: "Target Date", type: "date", width: "w-32" },
];

export default function ScopePage() {
  const { id } = useParams<{ id: string }>();
  const board = useBoard(db.scopeItems, id, "scope", (rid, projectId, now) => ({
    id: rid,
    projectId,
    category: "Deliverable",
    title: "",
    description: "",
    status: "Not started",
    dueDate: "",
    order: Date.now(),
    extra: {},
    createdAt: now,
    updatedAt: now,
  }));

  return (
    <div>
      <SectionHeader
        title="Scope"
        subtitle="Objectives, deliverables, milestones and exclusions — the boundary of what this project will and won't do."
      />
      <DynamicTable<ScopeItem>
        columns={COLUMNS}
        rows={board.rows}
        extraFields={board.extraFields}
        emptyLabel="No scope items yet. Start with your top 3 objectives and key deliverables."
        addLabel="Add scope item"
        onAddRow={board.addRow}
        onUpdateRow={board.updateRow}
        onDeleteRow={board.deleteRow}
        onAddExtraField={board.addExtraField}
        onRemoveExtraField={board.removeExtraField}
      />
    </div>
  );
}
