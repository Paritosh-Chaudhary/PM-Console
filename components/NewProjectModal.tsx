"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db } from "@/lib/db";
import { newId, nowIso } from "@/lib/utils";
import type { Health } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [network, setNetwork] = useState("");
  const [manager, setManager] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const id = newId();
    const now = nowIso();
    await db.projects.add({
      id,
      name: name.trim(),
      code: code.trim(),
      network: network.trim(),
      manager: manager.trim(),
      sponsor: sponsor.trim(),
      status: "Planning",
      health: "green" as Health,
      currency: currency.trim() || "USD",
      startDate,
      endDate,
      description,
      createdAt: now,
      updatedAt: now,
    });
    setSaving(false);
    onClose();
    router.push(`/projects/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-xl rounded-lg border border-base-border bg-base-surface shadow-glow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border">
          <h2 className="font-mono text-sm tracking-wide text-ink uppercase">New Project</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          <Field label="Project name *" className="col-span-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Core Network Modernization" autoFocus />
          </Field>
          <Field label="Project code">
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="NET-2026-04" />
          </Field>
          <Field label="Program / Network">
            <input className="input" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="APAC Infrastructure Program" />
          </Field>
          <Field label="Project manager">
            <input className="input" value={manager} onChange={(e) => setManager(e.target.value)} placeholder="You" />
          </Field>
          <Field label="Sponsor">
            <input className="input" value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="Head of ICT" />
          </Field>
          <Field label="Start date">
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Target end date">
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label="Currency">
            <input className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
          </Field>
          <Field label="Description" className="col-span-2">
            <textarea rows={3} className="input resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project delivering, and why?" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-base-border">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={create} disabled={!name.trim() || saving} className="btn-primary">
            {saving ? "Creating…" : "Create project"}
          </button>
        </div>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          background: #171d21;
          border: 1px solid #293238;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
          color: #e7ecee;
          outline: none;
        }
        .input:focus {
          border-color: #3fd6c4;
        }
        .btn-primary {
          background: #3fd6c4;
          color: #0e1316;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 6px;
        }
        .btn-primary:disabled {
          opacity: 0.5;
        }
        .btn-ghost {
          color: #93a1a8;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 6px;
        }
        .btn-ghost:hover {
          color: #e7ecee;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
