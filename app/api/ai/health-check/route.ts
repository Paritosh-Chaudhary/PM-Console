import { NextResponse } from "next/server";
import { askAIJson, RateLimitError } from "@/lib/aiServer";
import type { HealthCheckItem } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { project, scope, raid, budget, tasks, followups } = await req.json();

    // Send only the fields that matter — dropping ids, timestamps and empty
    // custom-field bags keeps the prompt small and the reply reliable.
    const pick = (rows: Record<string, unknown>[] = [], keys: string[]) =>
      rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k]])));
    const slim = {
      project: { name: project?.name, status: project?.status, health: project?.health, startDate: project?.startDate, endDate: project?.endDate },
      scope: pick(scope, ["category", "title", "status", "dueDate"]),
      raid: pick(raid, ["category", "title", "impact", "probability", "status", "targetDate"]),
      budget: pick(budget, ["category", "description", "plannedAmount", "actualAmount", "status"]),
      tasks: pick(tasks, ["title", "status", "priority", "assignee", "dueDate"]),
      followups: pick(followups, ["title", "status", "dueDate"]),
    };

    const system =
      "You are an ICT delivery governance assistant performing a proactive health check across a project's scope, RAID log, budget, tasks and follow-ups — the way a sharp PM would scan everything before a steering committee meeting, not just answer a narrow question. Look for: risks/issues implied by the data but not yet logged in RAID (e.g. a critical-priority blocked task with no matching RAID entry, a budget category trending over plan with no risk logged, a scope item at risk of slipping); and things that need a human follow-up but don't have one yet (e.g. an overdue task with no chase logged, a stale open risk with no recent update). Only flag things that are genuinely actionable and not already covered by an existing RAID or follow-up entry. Return 3-6 items ordered by severity. Keep every string to one or two short sentences.";

    const prompt = `Today's date: ${new Date().toISOString().slice(0, 10)}
Project: ${JSON.stringify(slim.project)}
Scope: ${JSON.stringify(slim.scope)}
Existing RAID log: ${JSON.stringify(slim.raid)}
Budget: ${JSON.stringify(slim.budget)}
Tasks: ${JSON.stringify(slim.tasks)}
Existing follow-ups: ${JSON.stringify(slim.followups)}

Return JSON of this exact shape:
{"items": [{
  "section": "raid|followups",
  "severity": "info|warning|critical",
  "title": "short flag title",
  "detail": "one to two sentences explaining what was noticed and why it matters",
  "raid": {"category": "Risk|Assumption|Issue|Dependency", "title": "...", "description": "...", "impact": "Low|Medium|High|Critical", "probability": "Low|Medium|High", "mitigation": "..."},
  "followup": {"title": "...", "notes": "..."}
}]}
Set "raid" only when section is "raid", and "followup" only when section is "followups" — omit (null) the other.`;

    const { data, rateLimit } = await askAIJson<{ items: HealthCheckItem[] }>(system, prompt, 2200);
    return NextResponse.json({ items: data.items ?? [], rateLimit });
  } catch (err: unknown) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message, retryAfter: err.retryAfter }, { status: 429 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI request failed" }, { status: 500 });
  }
}
