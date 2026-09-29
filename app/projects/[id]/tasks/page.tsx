"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useBoard } from "@/lib/useBoard";
import DynamicTable, { type ColumnDef } from "@/components/DynamicTable";
import type { TaskItem } from "@/lib/types";
import SectionHeader from "@/components/SectionHeader";
import { useSettings } from "@/lib/useSettings";
import { RefreshCw, UploadCloud, Loader2 } from "lucide-react";
import { newId, nowIso } from "@/lib/utils";

const COLUMNS: ColumnDef[] = [
  { key: "title", label: "Task", type: "text", width: "w-56" },
  { key: "description", label: "Description", type: "textarea", width: "w-64" },
  { key: "status", label: "Status", type: "status", width: "w-28", suggestions: ["To Do", "In Progress", "Blocked", "Done"] },
  { key: "priority", label: "Priority", type: "status", width: "w-24", suggestions: ["Low", "Medium", "High", "Critical"] },
  { key: "assignee", label: "Assignee", type: "text", width: "w-28" },
  { key: "startDate", label: "Start", type: "date", width: "w-32" },
  { key: "dueDate", label: "Due", type: "date", width: "w-32" },
  { key: "jiraKey", label: "Jira Key", type: "text", width: "w-24" },
  { key: "tags", label: "Tags", type: "text", width: "w-32" },
];

export default function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const project = useLiveQuery(() => db.projects.get(id), [id]);
  const { settings } = useSettings();
  const board = useBoard(db.tasks, id, "tasks", (rid, projectId, now) => ({
    id: rid,
    projectId,
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    assignee: "",
    startDate: "",
    dueDate: "",
    jiraKey: "",
    tags: "",
    extra: {},
    createdAt: now,
    updatedAt: now,
  }));

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const jiraConfigured = settings.jira.baseUrl && settings.jira.email && settings.jira.apiToken && settings.jira.projectKey;

  const pullFromJira = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/jira/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jira: settings.jira }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Jira request failed");
      const existingKeys = new Set(board.rows.map((t: TaskItem) => t.jiraKey).filter(Boolean));
      let added = 0;
      for (const issue of data.issues ?? []) {
        if (existingKeys.has(issue.key)) continue;
        const now = nowIso();
        await db.tasks.add({
          id: newId(),
          projectId: id,
          title: issue.summary,
          description: issue.description ?? "",
          status: issue.status ?? "To Do",
          priority: issue.priority ?? "Medium",
          assignee: issue.assignee ?? "",
          startDate: "",
          dueDate: issue.dueDate ?? "",
          jiraKey: issue.key,
          tags: "jira",
          extra: {},
          createdAt: now,
          updatedAt: now,
        });
        added++;
      }
      setSyncMsg(`Pulled ${added} new issue${added === 1 ? "" : "s"} from Jira (${data.issues?.length ?? 0} found).`);
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : "Jira sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const pushToJira = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const unsynced = board.rows.filter((t: TaskItem) => !t.jiraKey);
      const res = await fetch("/api/jira/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jira: settings.jira,
          tasks: unsynced.map((t: TaskItem) => ({ id: t.id, title: t.title, description: t.description, priority: t.priority })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Jira request failed");
      for (const created of data.created ?? []) {
        await db.tasks.update(created.id, { jiraKey: created.key, updatedAt: nowIso() });
      }
      setSyncMsg(`Created ${data.created?.length ?? 0} issue${(data.created?.length ?? 0) === 1 ? "" : "s"} in Jira.`);
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : "Jira sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Tasks"
        subtitle="Working task list for this project — sync selected tasks with Jira once it's configured in Settings."
        right={
          jiraConfigured ? (
            <div className="flex items-center gap-2">
              <button onClick={pullFromJira} disabled={syncing} className="jira-btn">
                {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Pull from Jira
              </button>
              <button onClick={pushToJira} disabled={syncing} className="jira-btn">
                {syncing ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Push new tasks
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-ink-faint">Connect Jira in Settings to sync tasks</span>
          )
        }
      />
      {syncMsg && <div className="mb-3 text-xs text-signal-cyan bg-signal-cyan/10 border border-signal-cyan/20 rounded-md px-3 py-2">{syncMsg}</div>}
      <DynamicTable<TaskItem>
        columns={COLUMNS}
        rows={board.rows}
        extraFields={board.extraFields}
        emptyLabel="No tasks yet. Break the scope down into concrete, assignable work."
        addLabel="Add task"
        onAddRow={board.addRow}
        onUpdateRow={board.updateRow}
        onDeleteRow={board.deleteRow}
        onAddExtraField={board.addExtraField}
        onRemoveExtraField={board.removeExtraField}
      />
      <style jsx global>{`
        .jira-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #5b9df9;
          border: 1px solid rgba(91, 157, 249, 0.3);
          border-radius: 6px;
          padding: 7px 10px;
        }
        .jira-btn:hover {
          background: rgba(91, 157, 249, 0.1);
        }
        .jira-btn:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
