/**
 * Server-side AI helper backed by Groq's free-tier API (OpenAI-compatible
 * chat completions endpoint). Kept as a single choke point so swapping
 * providers later only means editing this file.
 *
 * Get a free key (no credit card) at https://console.groq.com/keys
 */

export const AI_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface RateLimitInfo {
  limitRequests?: string;
  remainingRequests?: string;
  resetRequests?: string;
  limitTokens?: string;
  remainingTokens?: string;
  resetTokens?: string;
}

/** Thrown when Groq's free-tier rate limit (RPM/RPD/TPM/TPD) is hit. */
export class RateLimitError extends Error {
  retryAfter?: string;
  constructor(message: string, retryAfter?: string) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

function readRateLimit(headers: Headers): RateLimitInfo {
  return {
    limitRequests: headers.get("x-ratelimit-limit-requests") ?? undefined,
    remainingRequests: headers.get("x-ratelimit-remaining-requests") ?? undefined,
    resetRequests: headers.get("x-ratelimit-reset-requests") ?? undefined,
    limitTokens: headers.get("x-ratelimit-limit-tokens") ?? undefined,
    remainingTokens: headers.get("x-ratelimit-remaining-tokens") ?? undefined,
    resetTokens: headers.get("x-ratelimit-reset-tokens") ?? undefined,
  };
}

export async function askAI(
  system: string,
  prompt: string,
  maxTokens = 1200,
  jsonMode = false
): Promise<{ text: string; rateLimit: RateLimitInfo; truncated: boolean }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys, add it to a .env.local file at the project root (see .env.example), and restart the dev server."
    );
  }

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      temperature: jsonMode ? 0.2 : 0.4,
      // Groq's JSON mode guarantees syntactically valid JSON (the prompt
      // must mention "JSON", which askAIJson always does).
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  const rateLimit = readRateLimit(res.headers);

  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after") ?? undefined;
    throw new RateLimitError(
      `Groq's free-tier rate limit was hit (this resets automatically — try again in ${
        retryAfter ? `${retryAfter}s` : "about a minute"
      }).`,
      retryAfter
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content ?? "").trim();
  const truncated = data.choices?.[0]?.finish_reason === "length";
  return { text, rateLimit, truncated };
}

/** Strips markdown code fences and any stray prose around a JSON payload —
 * open-weight models frequently wrap JSON in ```json fences despite being
 * told not to. */
function extractJson(raw: string): string {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const firstBrace = Math.min(
    ...[s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0).concat([Infinity])
  );
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (firstBrace !== Infinity && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }
  return s;
}

/** Same as askAI, but forces JSON mode and parses the result. If the reply
 * is cut off (token limit) or otherwise unparseable, retries once with a
 * larger budget before giving up. Used for every "structured suggestion"
 * feature (RAID cards, budget insights, health check). */
export async function askAIJson<T>(
  system: string,
  prompt: string,
  maxTokens = 1400
): Promise<{ data: T; rateLimit: RateLimitInfo }> {
  const jsonSystem = `${system}\n\nRespond with ONLY a single valid JSON object matching the requested shape. No markdown code fences, no commentary before or after, no trailing commas. Keep string values concise.`;

  let lastRaw = "";
  for (const budget of [maxTokens, Math.round(maxTokens * 2)]) {
    const { text, rateLimit, truncated } = await askAI(jsonSystem, prompt, budget, true);
    lastRaw = text;
    try {
      const data = JSON.parse(extractJson(text)) as T;
      return { data, rateLimit };
    } catch {
      console.error(
        `[askAIJson] parse failed (truncated=${truncated}, maxTokens=${budget}). Raw start: ${text.slice(0, 200)}`
      );
    }
  }
  throw new Error(
    `The AI returned a response that couldn't be parsed as structured data (even after a retry). Raw reply started with: "${lastRaw.slice(0, 80)}…"`
  );
}
