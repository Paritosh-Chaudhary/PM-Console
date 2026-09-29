"use client";

import { useState } from "react";
import { useSettings } from "@/lib/useSettings";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import QuotaBadge, { type RateLimitInfo } from "@/components/QuotaBadge";

export default function SettingsPage() {
  const { settings, update, loaded } = useSettings();
  const [aiStatus, setAiStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [aiDetail, setAiDetail] = useState("");
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

  if (!loaded) return null;

  const testAi = async () => {
    setAiStatus("checking");
    setRateLimit(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: { name: "Connectivity check" }, scope: [], raid: [], budget: [], tasks: [], followups: [], ping: true }),
      });
      const data = await res.json();
      setRateLimit(data.rateLimit ?? null);
      if (res.ok && data.text) {
        setAiStatus("ok");
        setAiDetail("The server can reach Groq with your configured key.");
      } else {
        setAiStatus("fail");
        setAiDetail(data.error || "The AI endpoint did not return a result.");
      }
    } catch {
      setAiStatus("fail");
      setAiDetail("Could not reach /api/ai/summarize.");
    }
  };

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-mono uppercase tracking-widest text-signal-cyan mb-1.5">Settings</div>
        <h1 className="text-2xl font-semibold text-ink">Integrations &amp; API keys</h1>
        <p className="text-ink-muted text-sm mt-1.5">
          Jira and Confluence credentials are stored only in this browser's local storage and sent directly to the
          matching server route when you trigger a sync or publish action.
        </p>
      </div>

      <section className="rounded-lg border border-base-border bg-base-surface/60 p-5 mb-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <ShieldCheck size={15} className="text-signal-cyan" /> Groq API (AI features — free tier)
          </h2>
          <button onClick={testAi} className="text-xs text-signal-cyan border border-signal-cyan/30 rounded-md px-3 py-1.5 hover:bg-signal-cyan/10">
            {aiStatus === "checking" ? <Loader2 size={12} className="inline animate-spin" /> : "Test connection"}
          </button>
        </div>
        <p className="text-ink-muted text-xs mb-2">
          Set <code className="text-signal-cyan">GROQ_API_KEY</code> in a <code className="text-signal-cyan">.env.local</code> file at the project
          root (see <code className="text-signal-cyan">.env.example</code>). Get a free key — no credit card — at{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-signal-cyan underline">
            console.groq.com/keys
          </a>
          . This key stays server-side and is never exposed to the browser.
        </p>
        {aiStatus === "ok" && (
          <div className="flex items-center gap-1.5 text-xs text-signal-green mb-1"><CheckCircle2 size={13} /> {aiDetail}</div>
        )}
        {aiStatus === "fail" && (
          <div className="flex items-center gap-1.5 text-xs text-signal-red mb-1"><XCircle size={13} /> {aiDetail}</div>
        )}
        {rateLimit && (
          <div className="mt-1">
            <QuotaBadge info={rateLimit} />
          </div>
        )}
        <p className="text-ink-faint text-[11px] mt-3">
          Groq's free tier has no expiry date — it's gated by rolling per-minute and per-day rate limits, not a credit
          balance. The quota above (from Groq's response headers) shows how much of that you have left right now; it
          resets automatically. If you ever hit the limit, the app shows a friendly retry message instead of a raw error.
        </p>
      </section>

      <section className="rounded-lg border border-base-border bg-base-surface/60 p-5 mb-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Jira</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base URL">
            <input
              className="input"
              placeholder="https://yourorg.atlassian.net"
              value={settings.jira.baseUrl}
              onChange={(e) => update({ ...settings, jira: { ...settings.jira, baseUrl: e.target.value } })}
            />
          </Field>
          <Field label="Project key">
            <input
              className="input"
              placeholder="NET"
              value={settings.jira.projectKey}
              onChange={(e) => update({ ...settings, jira: { ...settings.jira, projectKey: e.target.value } })}
            />
          </Field>
          <Field label="Account email">
            <input
              className="input"
              placeholder="you@yourorg.com"
              value={settings.jira.email}
              onChange={(e) => update({ ...settings, jira: { ...settings.jira, email: e.target.value } })}
            />
          </Field>
          <Field label="API token">
            <input
              type="password"
              className="input"
              placeholder="Jira API token"
              value={settings.jira.apiToken}
              onChange={(e) => update({ ...settings, jira: { ...settings.jira, apiToken: e.target.value } })}
            />
          </Field>
        </div>
        <p className="text-ink-faint text-[11px] mt-3">
          Create a token at id.atlassian.com → Security → API tokens. Used by the Tasks tab's "Pull from Jira" / "Push new tasks" actions.
        </p>
      </section>

      <section className="rounded-lg border border-base-border bg-base-surface/60 p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Confluence</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base URL">
            <input
              className="input"
              placeholder="https://yourorg.atlassian.net/wiki"
              value={settings.confluence.baseUrl}
              onChange={(e) => update({ ...settings, confluence: { ...settings.confluence, baseUrl: e.target.value } })}
            />
          </Field>
          <Field label="Space key">
            <input
              className="input"
              placeholder="ICTPM"
              value={settings.confluence.spaceKey}
              onChange={(e) => update({ ...settings, confluence: { ...settings.confluence, spaceKey: e.target.value } })}
            />
          </Field>
          <Field label="Account email">
            <input
              className="input"
              placeholder="you@yourorg.com"
              value={settings.confluence.email}
              onChange={(e) => update({ ...settings, confluence: { ...settings.confluence, email: e.target.value } })}
            />
          </Field>
          <Field label="API token">
            <input
              type="password"
              className="input"
              placeholder="Confluence API token"
              value={settings.confluence.apiToken}
              onChange={(e) => update({ ...settings, confluence: { ...settings.confluence, apiToken: e.target.value } })}
            />
          </Field>
        </div>
        <p className="text-ink-faint text-[11px] mt-3">
          Used by the Reports tab's "Publish to Confluence" action to create a status-report page in this space.
        </p>
      </section>

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
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
