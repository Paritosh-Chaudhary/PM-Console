"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, AlertTriangle, ListChecks, Wallet, Wand2, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { HealthDot } from "@/components/StatusDot";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import NewProjectModal from "@/components/NewProjectModal";
import { seedSampleProject } from "@/lib/seed";
import { useAiStats } from "@/lib/aiActions";

export default function DashboardPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const aiStats = useAiStats();

  const loadSample = async () => {
    setSeeding(true);
    const id = await seedSampleProject();
    setSeeding(false);
    router.push(`/projects/${id}`);
  };
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray(), []);
  const raid = useLiveQuery(() => db.raidItems.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const budget = useLiveQuery(() => db.budgetLines.toArray(), []);

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-signal-cyan mb-1.5">
            Program Overview
          </div>
          <h1 className="text-2xl font-semibold text-ink">Your ICT Project Network</h1>
          <p className="text-ink-muted text-sm mt-1.5 max-w-xl">
            Every project below is a live node in your program — scope, RAID, budget, tasks, follow-ups and logs, all editable inline.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadSample}
            disabled={seeding}
            className="flex items-center gap-2 border border-base-border text-ink-muted text-sm px-4 py-2.5 rounded-md hover:text-ink hover:border-ink-faint transition-all disabled:opacity-50"
          >
            <Wand2 size={15} /> {seeding ? "Loading…" : "Load sample project"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-signal-cyan text-base font-semibold text-sm px-4 py-2.5 rounded-md hover:brightness-110 transition-all"
          >
            <Plus size={15} /> New Project
          </button>
        </div>
      </header>

      {aiStats.totalActions > 0 && (
        <div className="rounded-lg border border-signal-cyan/20 bg-gradient-to-r from-signal-cyan/[0.07] to-transparent px-5 py-3.5 mb-6 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-signal-cyan">
            <Sparkles size={15} />
            <span className="text-xs font-mono uppercase tracking-wide">AI Impact</span>
          </div>
          <ImpactStat value={aiStats.totalActions} label="AI actions run" />
          <ImpactStat value={aiStats.totalAccepted} label="suggestions accepted" />
          <ImpactStat value={`~${aiStats.totalHours}h`} label="estimated time saved" />
        </div>
      )}

      {(projects ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-base-border bg-base-surface/40 py-20 text-center">
          <p className="text-ink-muted text-sm mb-4">No projects yet — spin up the first node in your network.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={loadSample}
              disabled={seeding}
              className="inline-flex items-center gap-2 border border-base-border text-ink-muted text-sm px-4 py-2.5 rounded-md hover:text-ink hover:border-ink-faint transition-all"
            >
              <Wand2 size={15} /> {seeding ? "Loading…" : "Load sample project"}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-signal-cyan text-base font-semibold text-sm px-4 py-2.5 rounded-md hover:brightness-110 transition-all"
            >
              <Plus size={15} /> Create a project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(projects ?? []).map((p) => {
            const pRaid = (raid ?? []).filter((r) => r.projectId === p.id);
            const openRisks = pRaid.filter((r) => !/closed|mitigated|resolved/i.test(r.status)).length;
            const pTasks = (tasks ?? []).filter((t) => t.projectId === p.id);
            const overdueTasks = pTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
            const pBudget = (budget ?? []).filter((b) => b.projectId === p.id);
            const planned = pBudget.reduce((s, b) => s + (Number(b.plannedAmount) || 0), 0);
            const actual = pBudget.reduce((s, b) => s + (Number(b.actualAmount) || 0), 0);

            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-lg border border-base-border bg-base-surface/60 p-5 hover:border-signal-cyan/50 hover:shadow-glow transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HealthDot health={p.health} />
                    <span className="font-mono text-[11px] text-ink-faint uppercase tracking-wide">
                      {p.code || "—"}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-faint">{formatDate(p.updatedAt)}</span>
                </div>
                <h3 className="text-ink font-medium mb-1 group-hover:text-signal-cyan transition-colors">{p.name}</h3>
                <p className="text-ink-muted text-xs mb-4 line-clamp-2 min-h-[2em]">
                  {p.description || p.network || "No description yet."}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat icon={<AlertTriangle size={12} />} value={openRisks} label="Open RAID" warn={openRisks > 0} />
                  <Stat icon={<ListChecks size={12} />} value={overdueTasks} label="Overdue" warn={overdueTasks > 0} />
                  <Stat
                    icon={<Wallet size={12} />}
                    value={planned ? `${Math.round((actual / planned) * 100)}%` : "—"}
                    label="Budget used"
                    warn={planned > 0 && actual > planned}
                  />
                </div>
                {planned > 0 && (
                  <div className="mt-3 text-[11px] text-ink-faint font-mono">
                    {formatCurrency(actual, p.currency)} / {formatCurrency(planned, p.currency)}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function Stat({ icon, value, label, warn }: { icon: React.ReactNode; value: string | number; label: string; warn?: boolean }) {
  return (
    <div className={`rounded-md bg-base-raised/70 py-2 ${warn ? "text-signal-amber" : "text-ink-muted"}`}>
      <div className="flex items-center justify-center gap-1 text-[13px] font-mono font-medium">
        {icon}
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide mt-0.5 text-ink-faint">{label}</div>
    </div>
  );
}

function ImpactStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-base font-semibold text-ink">{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}
