"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, ListPlus, Check } from "lucide-react";
import type { BudgetInsightItem } from "@/lib/types";
import Badge from "./Badge";
import QuotaBadge, { type RateLimitInfo } from "./QuotaBadge";

export default function BudgetInsightsModal({
  loading,
  items,
  error,
  isRateLimited,
  rateLimit,
  onCreateFollowup,
  onClose,
}: {
  loading: boolean;
  items: BudgetInsightItem[];
  error: string | null;
  isRateLimited?: boolean;
  rateLimit?: RateLimitInfo | null;
  onCreateFollowup: (followup: { title: string; notes: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [added, setAdded] = useState<Set<number>>(new Set());

  const handleCreate = async (item: BudgetInsightItem, idx: number) => {
    if (!item.suggestedFollowup) return;
    await onCreateFollowup(item.suggestedFollowup);
    setAdded((prev) => new Set(prev).add(idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-signal-cyan/30 bg-base-surface shadow-glow max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border shrink-0">
          <h2 className="flex items-center gap-2 font-mono text-sm tracking-wide text-ink uppercase">
            <Sparkles size={14} className="text-signal-cyan" /> AI budget insights
          </h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center gap-2 text-ink-muted text-sm py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Analyzing budget lines…
            </div>
          )}
          {!loading && error && (
            <p className={`text-sm ${isRateLimited ? "text-signal-amber" : "text-signal-red"}`}>{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-ink-faint text-sm text-center py-8">No notable findings — spend looks broadly on track against plan.</p>
          )}
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => {
              const isAdded = added.has(idx);
              return (
                <div key={idx} className="rounded-lg border border-base-border bg-base-raised/40 p-4">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge value={item.severity} />
                      <span className="text-ink-faint text-[11px]">{item.category}</span>
                    </div>
                    {item.suggestedFollowup && (
                      <button
                        onClick={() => handleCreate(item, idx)}
                        disabled={isAdded}
                        className={`shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors ${
                          isAdded
                            ? "text-signal-green border border-signal-green/30 bg-signal-green/10"
                            : "text-signal-cyan border border-signal-cyan/30 hover:bg-signal-cyan/10"
                        }`}
                      >
                        {isAdded ? <Check size={12} /> : <ListPlus size={12} />}
                        {isAdded ? "Follow-up created" : "Create follow-up"}
                      </button>
                    )}
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
