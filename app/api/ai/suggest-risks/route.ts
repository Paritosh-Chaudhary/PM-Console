import { NextResponse } from "next/server";
import { askAIJson, RateLimitError } from "@/lib/aiServer";
import type { RaidSuggestionItem } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { projectName, description, network, existing } = await req.json();

    const system =
      "You are an experienced ICT program risk manager. Given a project's name and description, propose realistic, specific RAID entries (Risks, Assumptions, Issues, Dependencies) an ICT project manager should track. Be concrete to ICT/network/infrastructure delivery work (e.g. vendor lead times, change freezes, integration testing, cutover windows, licensing, security review, staffing). Avoid duplicating anything already logged. Return between 4 and 8 items.";

    const prompt = `Project: ${projectName || "Untitled project"}
Program / network: ${network || "n/a"}
Description: ${description || "n/a"}
Already logged (avoid duplicating): ${(existing || []).join("; ") || "none"}

Return JSON of this exact shape:
{"items": [{"category": "Risk|Assumption|Issue|Dependency", "title": "short title", "description": "one to two sentence rationale", "impact": "Low|Medium|High|Critical", "probability": "Low|Medium|High", "mitigation": "a concrete first mitigation step"}]}`;

    const { data, rateLimit } = await askAIJson<{ items: RaidSuggestionItem[] }>(system, prompt, 1000);
    return NextResponse.json({ items: data.items ?? [], rateLimit });
  } catch (err: unknown) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message, retryAfter: err.retryAfter }, { status: 429 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI request failed" }, { status: 500 });
  }
}
