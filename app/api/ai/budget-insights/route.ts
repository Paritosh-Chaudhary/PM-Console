import { NextResponse } from "next/server";
import { askAIJson, RateLimitError } from "@/lib/aiServer";
import type { BudgetInsightItem } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { projectName, currency, lines } = await req.json();

    const system =
      "You are an ICT program financial controller. Given a list of budget lines (category, description, planned amount, actual amount, period, status) for a project, analyze spend: flag categories over budget, flag categories under-spending vs. likely timeline risk, note any lines with actuals but no plan (scope creep signal). For anything that genuinely warrants a human follow-up action, include a suggestedFollowup. Return 2-5 items, ordered most important first.";

    const prompt = `Project: ${projectName || "Untitled project"}
Currency: ${currency || "USD"}
Budget lines (JSON): ${JSON.stringify(lines || [])}

Return JSON of this exact shape:
{"items": [{"severity": "info|warning|critical", "category": "budget category or General", "title": "short finding", "detail": "one to two sentence explanation, cite numbers", "suggestedFollowup": {"title": "short follow-up title", "notes": "what to chase and why"} }]}
Only include suggestedFollowup when a specific action is genuinely warranted; otherwise set it to null.`;

    const { data, rateLimit } = await askAIJson<{ items: BudgetInsightItem[] }>(system, prompt, 1100);
    return NextResponse.json({ items: data.items ?? [], rateLimit });
  } catch (err: unknown) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message, retryAfter: err.retryAfter }, { status: 429 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI request failed" }, { status: 500 });
  }
}
