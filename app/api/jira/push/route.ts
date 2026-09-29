import { NextResponse } from "next/server";

interface JiraCreds {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

interface PushTask {
  id: string;
  title: string;
  description?: string;
  priority?: string;
}

function authHeader(creds: JiraCreds) {
  const token = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
  return `Basic ${token}`;
}

export async function POST(req: Request) {
  try {
    const { jira, tasks } = (await req.json()) as { jira: JiraCreds; tasks: PushTask[] };
    if (!jira?.baseUrl || !jira?.email || !jira?.apiToken || !jira?.projectKey) {
      return NextResponse.json({ error: "Jira is not fully configured — check Settings." }, { status: 400 });
    }
    if (!tasks?.length) {
      return NextResponse.json({ created: [] });
    }

    const base = jira.baseUrl.replace(/\/$/, "");
    const created: Array<{ id: string; key: string }> = [];
    const errors: string[] = [];

    for (const task of tasks.slice(0, 25)) {
      const res = await fetch(`${base}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: authHeader(jira),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fields: {
            project: { key: jira.projectKey },
            summary: task.title || "Untitled task",
            issuetype: { name: "Task" },
            description: task.description
              ? {
                  type: "doc",
                  version: 1,
                  content: [{ type: "paragraph", content: [{ type: "text", text: task.description }] }],
                }
              : undefined,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        errors.push(`${task.title}: ${res.status} ${text.slice(0, 150)}`);
        continue;
      }
      const data = await res.json();
      created.push({ id: task.id, key: data.key });
    }

    return NextResponse.json({ created, errors });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Jira request failed" }, { status: 500 });
  }
}
