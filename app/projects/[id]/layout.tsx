"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { HealthDot, statusColor } from "@/components/StatusDot";
import { formatDate } from "@/lib/utils";
import type { Health } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/scope", label: "Scope" },
  { href: "/raid", label: "RAID Log" },
  { href: "/budget", label: "Budget" },
  { href: "/tasks", label: "Tasks" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/logs", label: "Logs" },
  { href: "/reports", label: "AI Reports" },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const project = useLiveQuery(() => db.projects.get(id), [id]);

  if (!project) {
    return <div className="px-8 py-10 text-ink-muted text-sm">Loading project…</div>;
  }

  const base = `/projects/${id}`;

  const updateField = async (patch: Partial<typeof project>) => {
    await db.projects.update(id, { ...patch, updatedAt: new Date().toISOString() } as never);
  };

  const removeProject = async () => {
    if (!confirm(`Delete "${project.name}" and all of its scope, RAID, budget, tasks, follow-ups and logs? This cannot be undone.`)) return;
    await db.transaction("rw", [db.projects, db.scopeItems, db.raidItems, db.budgetLines, db.tasks, db.followups, db.logs, db.boardConfigs], async () => {
      await db.scopeItems.where("projectId").equals(id).delete();
      await db.raidItems.where("projectId").equals(id).delete();
      await db.budgetLines.where("projectId").equals(id).delete();
      await db.tasks.where("projectId").equals(id).delete();
      await db.followups.where("projectId").equals(id).delete();
      await db.logs.where("projectId").equals(id).delete();
      await db.boardConfigs.where("projectId").equals(id).delete();
      await db.projects.delete(id);
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-base-border bg-base-surface/60 px-8 pt-6 pb-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <input
                className="font-mono text-[11px] uppercase tracking-wider text-ink-faint bg-transparent outline-none focus:text-signal-cyan w-32"
                defaultValue={project.code}
                onBlur={(e) => updateField({ code: e.target.value })}
              />
              <span className="text-ink-faint text-[11px]">·</span>
              <input
                className="text-[11px] text-ink-faint bg-transparent outline-none focus:text-signal-cyan"
                defaultValue={project.network}
                placeholder="Program / network"
                onBlur={(e) => updateField({ network: e.target.value })}
              />
            </div>
            <input
              className="text-xl font-semibold text-ink bg-transparent outline-none w-full mb-2"
              defaultValue={project.name}
              onBlur={(e) => updateField({ name: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <HealthDot health={project.health} />
                <select
                  className="bg-transparent outline-none text-ink-muted"
                  value={project.health}
                  onChange={(e) => updateField({ health: e.target.value as Health })}
                >
                  <option value="green">On track</option>
                  <option value="amber">At risk</option>
                  <option value="red">Critical</option>
                </select>
              </span>
              <StatusField value={project.status} onChange={(v) => updateField({ status: v })} />
              <span>PM: <EditableSpan value={project.manager} onChange={(v) => updateField({ manager: v })} placeholder="—" /></span>
              <span>Sponsor: <EditableSpan value={project.sponsor} onChange={(v) => updateField({ sponsor: v })} placeholder="—" /></span>
              <span className="font-mono">{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
            </div>
          </div>
          <button
            onClick={removeProject}
            className="text-ink-faint hover:text-signal-red transition-colors p-1.5 shrink-0"
            title="Delete project"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const href = `${base}${tab.href}`;
            const active = tab.href === "" ? pathname === base : pathname.startsWith(href);
            return (
              <Link
                key={tab.href}
                href={href}
                className={`px-3.5 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-signal-cyan text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-8 py-6 max-w-7xl mx-auto">{children}</div>
    </div>
  );
}

function EditableSpan({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="bg-transparent outline-none text-ink border-b border-transparent focus:border-signal-cyan/40 min-w-[60px]"
      defaultValue={value}
      placeholder={placeholder}
      onBlur={(e) => {
        if (e.target.value !== value) onChange(e.target.value);
      }}
      size={Math.max((value || placeholder || "").length, 4)}
    />
  );
}

function StatusField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="status-dot" style={{ backgroundColor: statusColor(value) }} />
      <input
        list="project-status-suggestions"
        className="bg-transparent outline-none text-ink-muted w-24"
        defaultValue={value}
        onBlur={(e) => {
          if (e.target.value !== value) onChange(e.target.value);
        }}
      />
      <datalist id="project-status-suggestions">
        <option value="Planning" />
        <option value="Active" />
        <option value="On Hold" />
        <option value="Closed" />
      </datalist>
    </span>
  );
}
