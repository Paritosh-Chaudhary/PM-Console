"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useBoard } from "@/lib/useBoard";
import type { FollowupItem } from "@/lib/types";
import SectionHeader from "@/components/SectionHeader";
import StatusDot from "@/components/StatusDot";
import { isOverdue } from "@/lib/utils";
import { Plus, Trash2, Link2 } from "lucide-react";

export default function FollowupsPage() {
  const { id } = useParams<{ id: string }>();
  const tasks = useLiveQuery(() => db.tasks.where("projectId").equals(id).toArray(), [id]) ?? [];
  const board = useBoard(db.followups, id, "followups", (rid, projectId, now) => ({
    id: rid,
    projectId,
    taskId: "",
    title: "",
    notes: "",
    owner: "",
    status: "Pending",
    dueDate: "",
    extra: {},
    createdAt: now,
    updatedAt: now,
  }));

  const taskTitle = (taskId: string) => tasks.find((t) => t.id === taskId)?.title;

  return (
    <div>
      <SectionHeader
        title="Follow-ups"
        subtitle="Action items and check-ins that need a nudge — optionally linked back to a task."
      />
      <div className="rounded-lg border border-base-border bg-base-surface/60 overflow-hidden">
        <div className="divide-y divide-base-bordersoft">
          {board.rows.length === 0 && (
            <div className="px-4 py-8 text-center text-ink-faint text-sm">
              No follow-ups yet. Log something you need to chase — a decision, a reply, a blocked handoff.
            </div>
          )}
          {board.rows.map((f: FollowupItem) => {
            const overdue = isOverdue(f.dueDate, f.status);
            return (
              <div key={f.id} className="p-4 grid grid-cols-12 gap-3 items-start group hover:bg-base-raised/30">
                <div className="col-span-4">
                  <input
                    className="cell-input font-medium"
                    defaultValue={f.title}
                    placeholder="Follow-up title"
                    onBlur={(e) => e.target.value !== f.title && board.updateRow(f.id, { title: e.target.value })}
                  />
                  <textarea
                    className="cell-textarea text-ink-muted"
                    rows={2}
                    defaultValue={f.notes}
                    placeholder="Notes…"
                    onBlur={(e) => e.target.value !== f.notes && board.updateRow(f.id, { notes: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-ink-faint uppercase block mb-1">Owner</label>
                  <input
                    className="cell-input"
                    defaultValue={f.owner}
                    onBlur={(e) => e.target.value !== f.owner && board.updateRow(f.id, { owner: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-ink-faint uppercase block mb-1">Status</label>
                  <input
                    list="followup-status"
                    className="cell-input"
                    defaultValue={f.status}
                    onBlur={(e) => e.target.value !== f.status && board.updateRow(f.id, { status: e.target.value })}
                  />
                  <datalist id="followup-status">
                    <option value="Pending" />
                    <option value="In Progress" />
                    <option value="Done" />
                  </datalist>
                  <div className="mt-1"><StatusDot value={f.status} /></div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-ink-faint uppercase block mb-1">Due</label>
                  <input
                    type="date"
                    className={`cell-input ${overdue ? "text-signal-red" : ""}`}
                    defaultValue={f.dueDate}
                    onBlur={(e) => e.target.value !== f.dueDate && board.updateRow(f.id, { dueDate: e.target.value })}
                  />
                  {overdue && <div className="text-[10px] text-signal-red mt-1">Overdue</div>}
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] text-ink-faint uppercase block mb-1">Task</label>
                  <select
                    className="cell-input text-xs"
                    defaultValue={f.taskId}
                    onChange={(e) => board.updateRow(f.id, { taskId: e.target.value })}
                  >
                    <option value="">—</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title || "Untitled task"}</option>
                    ))}
                  </select>
                  {f.taskId && taskTitle(f.taskId) && (
                    <div className="flex items-center gap-1 text-[10px] text-signal-blue mt-1 truncate">
                      <Link2 size={10} /> {taskTitle(f.taskId)}
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => board.deleteRow(f.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-signal-red p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={board.addRow}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink-muted hover:text-signal-cyan hover:bg-base-raised/40 transition-colors border-t border-base-border"
        >
          <Plus size={14} /> Add follow-up
        </button>
      </div>
    </div>
  );
}
