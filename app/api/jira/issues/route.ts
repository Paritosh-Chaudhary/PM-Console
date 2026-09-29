import { NextResponse } from "next/server";

interface JiraCreds {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

function authHeader(creds: JiraCreds) {
  const token = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
  return `Basic ${token}`;
}

// Jira descriptions come back as Atlassian Document Format (ADF) — flatten
// it to plain text so it fits our simple text fields.
function adfToText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === "text" && n.text) return n.text;
  if (Array.isArray(n.content)) {
    return n.content.map(adfToText).join(n.type === "paragraph" ? "\n" : " ");
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const { jira } = (await req.json()) as { jira: JiraCreds };
    if (!jira?.baseUrl || !jira?.email || !jira?.apiToken || !jira?.projectKey) {
      return NextResponse.json({ error: "Jira is not fully configured — check Settings." }, { status: 400 });
    }

    const base = jira.baseUrl.replace(/\/$/, "");
    const jql = encodeURIComponent(`project = "${jira.projectKey}" ORDER BY updated DESC`);
    const url = `${base}/rest/api/3/search?jql=${jql}&maxResults=50&fields=summary,description,status,priority,assignee,duedate`;

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader(jira),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Jira responded ${res.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await res.json();
    const issues = (data.issues || []).map((issue: Record<string, unknown>) => {
      const fields = issue.fields as Record<string, unknown>;
      return {
        key: issue.key,
        summary: fields.summary,
        description: adfToText(fields.description),
        status: (fields.status as { name?: string } | undefined)?.name,
        priority: (fields.priority as { name?: string } | undefined)?.name,
        assignee: (fields.assignee as { displayName?: string } | undefined)?.displayName,
        dueDate: fields.duedate,
      };
    });

    return NextResponse.json({ issues });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Jira request failed" }, { status: 500 });
  }
}
