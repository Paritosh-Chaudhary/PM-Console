"use client";

import { useState } from "react";
import { X, ScanEye, Loader2, Plus, ListPlus, Check } from "lucide-react";
import type { HealthCheckItem } from "@/lib/types";
import Badge from "./Badge";
import QuotaBadge, { type RateLimitInfo } from "./QuotaBadge";

/** The proactive, cross-section AI feature: rather than waiting for a
 * question, this scans scope + RAID + budget + tasks + follow-ups together
 * — the way a PM scans everything before a steering committee — and
 * surfaces only what isn't already covered, each with a one-click action. */
export default function HealthCheckModal({
  loading,
  items,
  error,
  isRateLimited,
  rateLimit,
  onAddRaid,
  onAddFollowup,
  onClose,
}: {
  loading: boolean;
  items: HealthCheckItem[];
  error: string | null;
  isRateLimited?: boolean;
  rateLimit?: RateLimitInfo | null;
  onAddRaid: (item: HealthCheckItem) => Promise<void>;
  onAddFollowup: (item: HealthCheckItem) => Promise<void>;
  onClose: () => void;
}) {
  const [added, setAdded] = useState<Set<number>>(new Set());

  const handleAction = async (item: HealthCheckItem, idx: number) => {
    if (item.section === "raid") await onAddRaid(item);
    else await onAddFollowup(item);
    setAdded((prev) => new Set(prev).add(idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-signal-violet/30 bg-base-surface shadow-glow max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border shrink-0">
          <div>
            <h2 className="flex items-center gap-2 font-mono text-sm tracking-wide text-ink uppercase">
              <ScanEye size={14} className="text-signal-violet" /> AI Health Check
            </h2>
            <p className="text-ink-faint text-[11px] mt-0.5">
              Scanned scope, RAID, budget, tasks &amp; follow-ups together for gaps — not just what's already logged.
            </p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center gap-2 text-ink-muted text-sm py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Cross-checking scope, RAID, budget, tasks &amp; follow-ups…
            </div>
          )}
          {!loading && error && (
            <p className={`text-sm ${isRateLimited ? "text-signal-amber" : "text-signal-red"}`}>{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-ink-faint text-sm text-center py-8">
              Nothing stood out — RAID and follow-ups look consistent with the rest of the project data.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => {
              const isAdded = added.has(idx);
              return (
                <div key={idx} className="rounded-lg border border-base-border bg-base-raised/40 p-4">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge value={item.severity} />
                      <span className="text-ink-faint text-[11px] uppercase font-mono">
                        {item.section === "raid" ? "Missing RAID entry" : "Missing follow-up"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAction(item, idx)}
                      disabled={isAdded}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors ${
                        isAdded
                          ? "text-signal-green border border-signal-green/30 bg-signal-green/10"
                          : "text-signal-violet border border-signal-violet/30 hover:bg-signal-violet/10"
                      }`}
                    >
                      {isAdded ? <Check size={12} /> : item.section === "raid" ? <Plus size={12} /> : <ListPlus size={12} />}
                      {isAdded ? "Added" : item.section === "raid" ? "Add to RAID Log" : "Create follow-up"}
                    </button>
                  </div>
                  <div className="text-ink font-medium text-sm mb-1">{item.title}</div>
                  <p className="text-ink-muted text-xs leading-relaxed">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-base-border shrink-0">
          <QuotaBadge info={rateLimit} />
          <button onClick={onClose} className="text-ink-muted text-sm px-3 py-1.5 hover:text-ink">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
