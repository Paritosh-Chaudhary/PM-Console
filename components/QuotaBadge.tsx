"use client";

import { Gauge } from "lucide-react";

export interface RateLimitInfo {
  limitRequests?: string;
  remainingRequests?: string;
  resetRequests?: string;
  limitTokens?: string;
  remainingTokens?: string;
  resetTokens?: string;
}

/** Renders Groq's free-tier quota (from response headers) so it's obvious
 * when you're getting close to the rate limit, instead of finding out via
 * a failed request. */
export default function QuotaBadge({ info }: { info?: RateLimitInfo | null }) {
  if (!info || (!info.remainingRequests && !info.remainingTokens)) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-ink-faint font-mono">
      <Gauge size={11} />
      {info.remainingRequests && info.limitRequests && (
        <span>
          {info.remainingRequests}/{info.limitRequests} requests left
        </span>
      )}
      {info.remainingTokens && info.limitTokens && (
        <span>· {info.remainingTokens}/{info.limitTokens} tokens left</span>
      )}
      {info.resetRequests && <span>· resets in {info.resetRequests}</span>}
    </div>
  );
}
