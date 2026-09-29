"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useSettings } from "@/lib/useSettings";
import SectionHeader from "@/components/SectionHeader";
import { newId, nowIso } from "@/lib/utils";
import QuotaBadge, { type RateLimitInfo } from "@/components/QuotaBadge";
import { logAiAction, markAiActionAccepted } from "@/lib/aiActions";
import { Loader2, Sparkles, Save, Send, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const project = useLiveQuery(() => db.projects.get(id), [id]);
  const raid = useLiveQuery(() => db.raidItems.where("projectId").equals(id).toArray(), [id]) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where("projectId").equals(id).toArray(), [id]) ?? [];
  const budget = useLiveQuery(() => db.budgetLines.where("projectId").equals(id).toArray(), [id]) ?? [];
  const followups = useLiveQuery(() => db.followups.where("projectId").equals(id).toArray(), [id]) ?? [];
  const scope = useLiveQuery(() => db.scopeItems.where("projectId").equals(id).toArray(), [id]) ?? [];

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const confluenceConfigured = settings.confluence.baseUrl && settings.confluence.email && settings.confluence.apiToken && settings.confluence.spaceKey;

  const generate = async () => {
    setLoading(true);
    setReport("");
    setSaved(false);
    setPublishMsg(null);
    setIsRateLimited(false);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          scope,
          raid,
          budget,
          tasks,
          followups,
        }),
      });
      const data = await res.json();
      setRateLimit(data.rateLimit ?? null);
      if (res.status === 429) {
        setIsRateLimited(true);
        setReport(data.error);
      } else {
        setReport(data.text || data.error || "No response.");
        await logAiAction(id, "report");
      }
    } catch {
      setReport("Something went wrong reaching the AI endpoint. Check your GROQ_API_KEY in .env.local.");
    } finally {
      setLoading(false);
    }
  };

  const saveToLog = async () => {
    if (!report) return;
    const now = nowIso();
    await db.logs.add({
      id: newId(),
      projectId: id,
      type: "AI Report",
      title: `Status report — ${new Date().toLocaleDateString()}`,
      notes: report,
      author: "AI",
      date: now.slice(0, 10),
      extra: {},
      createdAt: now,
    });
    setSaved(true);
    await markAiActionAccepted(id, "report");
  };

  const publish = async () => {
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch("/api/confluence/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confluence: settings.confluence,
          title: `${project?.name ?? "Project"} — Status Report (${new Date().toLocaleDateString()})`,
          body: report,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setPublishMsg(`Published to Confluence: ${data.url ?? "page created"}.`);
    } catch (e: unknown) {
      setPublishMsg(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="AI Reports"
        subtitle="Generate a status report from live scope, RAID, budget, tasks and follow-up data — save it to the log or publish it to Confluence."
      />

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-signal-cyan text-base font-semibold text-sm px-4 py-2.5 rounded-md hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Generate status report
        </button>
        {report && !loading && !isRateLimited && (
          <>
            <button
              onClick={saveToLog}
              className="flex items-center gap-1.5 text-sm text-ink-muted border border-base-border rounded-md px-3 py-2.5 hover:text-ink hover:border-ink-faint transition-colors"
            >
              {saved ? <CheckCircle2 size={14} className="text-signal-green" /> : <Save size={14} />}
              {saved ? "Saved to log" : "Save to log"}
            </button>
            <button
              onClick={publish}
              disabled={!confluenceConfigured || publishing}
              title={confluenceConfigured ? "Publish this report as a Confluence page" : "Connect Confluence in Settings first"}
              className="flex items-center gap-1.5 text-sm text-signal-blue border border-signal-blue/30 rounded-md px-3 py-2.5 hover:bg-signal-blue/10 transition-colors disabled:opacity-40"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publish to Confluence
            </button>
          </>
        )}
        <div className="ml-auto">
          <QuotaBadge info={rateLimit} />
        </div>
      </div>

      {publishMsg && (
        <div className="mb-4 text-xs text-signal-cyan bg-signal-cyan/10 border border-signal-cyan/20 rounded-md px-3 py-2">{publishMsg}</div>
      )}

      <div className="rounded-lg border border-base-border bg-base-surface/60 p-6 min-h-[240px]">
        {loading && (
          <div className="flex items-center gap-2 text-ink-muted text-sm justify-center py-10">
            <Loader2 size={16} className="animate-spin" /> Drafting report from current project data…
          </div>
        )}
        {!loading && !report && (
          <p className="text-ink-faint text-sm text-center py-10">
            Nothing generated yet. Click "Generate status report" to summarize scope, RAID, budget, tasks and follow-ups into an executive-ready update.
          </p>
        )}
        {!loading && report && (
          <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${isRateLimited ? "text-signal-amber" : "text-ink"}`}>
            {report}
          </pre>
        )}
      </div>
    </div>
  );
}
