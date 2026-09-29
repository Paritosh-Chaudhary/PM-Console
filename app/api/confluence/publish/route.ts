import { NextResponse } from "next/server";

interface ConfluenceCreds {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
}

function authHeader(creds: ConfluenceCreds) {
  const token = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
  return `Basic ${token}`;
}

// Plain-text report -> minimal Confluence storage-format HTML.
function toStorageHtml(text: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter(Boolean);
      if (lines.length > 1 && lines.every((l) => /^[-*\d.]/.test(l.trim()))) {
        return `<ul>${lines.map((l) => `<li>${escape(l.replace(/^[-*\d.]+\s*/, ""))}</li>`).join("")}</ul>`;
      }
      if (/^#{1,3}\s/.test(block) || (block.length < 60 && /:$/.test(block.trim()))) {
        return `<h3>${escape(block.replace(/^#{1,3}\s*/, ""))}</h3>`;
      }
      return `<p>${escape(block).replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const { confluence, title, body } = (await req.json()) as {
      confluence: ConfluenceCreds;
      title: string;
      body: string;
    };
    if (!confluence?.baseUrl || !confluence?.email || !confluence?.apiToken || !confluence?.spaceKey) {
      return NextResponse.json({ error: "Confluence is not fully configured — check Settings." }, { status: 400 });
    }

    const base = confluence.baseUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/rest/api/content`, {
      method: "POST",
      headers: {
        Authorization: authHeader(confluence),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        type: "page",
        title,
        space: { key: confluence.spaceKey },
        body: {
          storage: {
            value: toStorageHtml(body || ""),
            representation: "storage",
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Confluence responded ${res.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await res.json();
    const webui = data?._links?.webui;
    const url = webui ? `${base}${webui}` : undefined;
    return NextResponse.json({ url, id: data.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Confluence request failed" }, { status: 500 });
  }
}
