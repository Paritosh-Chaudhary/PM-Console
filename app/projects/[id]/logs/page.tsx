"use client";

import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { useBoard } from "@/lib/useBoard";
import DynamicTable, { type ColumnDef } from "@/components/DynamicTable";
import type { LogItem } from "@/lib/types";
import SectionHeader from "@/components/SectionHeader";

const COLUMNS: ColumnDef[] = [
  { key: "type", label: "Type", type: "status", width: "w-32", suggestions: ["Decision", "Change", "Activity", "Meeting Note", "AI Report"] },
  { key: "title", label: "Title", type: "text", width: "w-56" },
  { key: "notes", label: "Notes", type: "textarea", width: "w-96" },
  { key: "author", label: "Author", type: "text", width: "w-28" },
  { key: "date", label: "Date", type: "date", width: "w-32" },
];

export default function LogsPage() {
  const { id } = useParams<{ id: string }>();
  const board = useBoard(db.logs, id, "logs", (rid, projectId, now) => ({
    id: rid,
    projectId,
    type: "Activity",
    title: "",
    notes: "",
    author: "",
    date: now.slice(0, 10),
    extra: {},
    createdAt: now,
  }));

  return (
    <div>
      <SectionHeader
        title="Logs"
        subtitle="Decisions, changes, meeting notes and activity — a chronological record for the project. AI-generated reports are saved here too."
      />
      <DynamicTable<LogItem>
        columns={COLUMNS}
        rows={[...board.rows].sort((a: LogItem, b: LogItem) => (b.date || "").localeCompare(a.date || ""))}
        extraFields={board.extraFields}
        emptyLabel="No log entries yet."
        addLabel="Add log entry"
        onAddRow={board.addRow}
        onUpdateRow={board.updateRow}
        onDeleteRow={board.deleteRow}
        onAddExtraField={board.addExtraField}
        onRemoveExtraField={board.removeExtraField}
      />
    </div>
  );
}
