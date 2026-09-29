"use client";

import { Sparkles } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  onAi,
  aiLabel,
  right,
}: {
  title: string;
  subtitle: string;
  onAi?: () => void;
  aiLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-ink-muted text-sm mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right}
        {onAi && (
          <button
            onClick={onAi}
            className="flex items-center gap-1.5 text-xs font-medium text-signal-cyan border border-signal-cyan/30 rounded-md px-3 py-2 hover:bg-signal-cyan/10 transition-colors"
          >
            <Sparkles size={13} /> {aiLabel}
          </button>
        )}
      </div>
    </div>
  );
}
