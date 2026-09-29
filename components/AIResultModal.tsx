"use client";

import { X, Sparkles, Loader2, Send } from "lucide-react";
import QuotaBadge, { type RateLimitInfo } from "./QuotaBadge";

export default function AIResultModal({
  title,
  loading,
  text,
  onClose,
  onPublish,
  publishLabel,
  rateLimit,
  isRateLimited,
}: {
  title: string;
  loading: boolean;
  text: string;
  onClose: () => void;
  onPublish?: () => void;
  publishLabel?: string;
  rateLimit?: RateLimitInfo | null;
  isRateLimited?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-signal-cyan/30 bg-base-surface shadow-glow max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border shrink-0">
          <h2 className="flex items-center gap-2 font-mono text-sm tracking-wide text-ink uppercase">
            <Sparkles size={14} className="text-signal-cyan" /> {title}
          </h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center gap-2 text-ink-muted text-sm py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Thinking…
            </div>
          ) : (
            <pre
              className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${
                isRateLimited ? "text-signal-amber" : "text-ink"
              }`}
            >
              {text}
            </pre>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-base-border shrink-0">
          <QuotaBadge info={rateLimit} />
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className="text-ink-muted text-sm px-3 py-2 hover:text-ink">
              Close
            </button>
            {onPublish && !loading && text && !isRateLimited && (
              <button
                onClick={onPublish}
                className="flex items-center gap-1.5 bg-signal-cyan text-base text-sm font-semibold px-3.5 py-2 rounded-md hover:brightness-110"
              >
                <Send size={13} /> {publishLabel ?? "Publish to Confluence"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
