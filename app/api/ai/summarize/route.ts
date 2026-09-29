import { NextResponse } from "next/server";
import { askAI, RateLimitError } from "@/lib/aiServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, scope, raid, budget, tasks, followups, ping } = body;

    if (ping) {
      const { text, rateLimit } = await askAI("Reply with exactly: OK", "ping", 20);
      return NextResponse.json({ text, rateLimit });
    }

    const system =
      "You are an ICT project manager writing a concise executive status report from raw project-tracker data (scope, RAID log, budget, tasks, follow-ups). Write in plain, confident, specific prose — no fluff, no repeating raw data verbatim, synthesize it. Structure with short headings: Overall Status, Scope & Progress, Key Risks & Issues, Budget, Upcoming / Follow-ups. Keep it under 350 words. Do not invent facts not implied by the data. No preamble before the headings.";

    const prompt = `Project: ${JSON.stringify(project)}
Scope items: ${JSON.stringify(scope)}
RAID log: ${JSON.stringify(raid)}
Budget lines: ${JSON.stringify(budget)}
Tasks: ${JSON.stringify(tasks)}
Follow-ups: ${JSON.stringify(followups)}

Write the status report.`;

    const { text, rateLimit } = await askAI(system, prompt, 1200);
    return NextResponse.json({ text, rateLimit });
  } catch (err: unknown) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message, retryAfter: err.retryAfter }, { status: 429 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI request failed" }, { status: 500 });
  }
}
