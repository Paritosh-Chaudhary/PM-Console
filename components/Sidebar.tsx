"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { LayoutGrid, Settings, Radio } from "lucide-react";
import { db } from "@/lib/db";
import { HealthDot } from "./StatusDot";

function TopologyMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <line x1="6" y1="8" x2="15" y2="15" stroke="#3FD6C4" strokeWidth="1.2" opacity="0.6" />
      <line x1="24" y1="8" x2="15" y2="15" stroke="#3FD6C4" strokeWidth="1.2" opacity="0.6" />
      <line x1="6" y1="24" x2="15" y2="15" stroke="#3FD6C4" strokeWidth="1.2" opacity="0.6" />
      <line x1="24" y1="24" x2="15" y2="15" stroke="#3FD6C4" strokeWidth="1.2" opacity="0.6" />
      <circle cx="6" cy="8" r="2.2" fill="#5B9DF9" />
      <circle cx="24" cy="8" r="2.2" fill="#5B9DF9" />
      <circle cx="6" cy="24" r="2.2" fill="#5B9DF9" />
      <circle cx="24" cy="24" r="2.2" fill="#5B9DF9" />
      <circle cx="15" cy="15" r="3.4" fill="#3FD6C4">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray(), []);

  return (
    <aside className="w-64 shrink-0 border-r border-base-border bg-base-surface/80 backdrop-blur-sm flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-base-border">
        <TopologyMark />
        <div>
          <div className="font-mono text-[13px] tracking-wide text-ink font-semibold">ICT PM CONSOLE</div>
          <div className="text-[11px] text-ink-faint">Program &amp; Network Ops</div>
        </div>
      </div>

      <nav className="px-3 py-4 flex flex-col gap-1">
        <SidebarLink href="/" icon={<LayoutGrid size={15} />} label="Dashboard" active={pathname === "/"} />
        <SidebarLink
          href="/settings"
          icon={<Settings size={15} />}
          label="Settings & Integrations"
          active={pathname === "/settings"}
        />
      </nav>

      <div className="px-5 pt-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
        <Radio size={11} /> Active Projects
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
        {(projects ?? []).length === 0 && (
          <div className="px-3 py-2 text-xs text-ink-faint">No projects yet.</div>
        )}
        {(projects ?? []).map((p) => {
          const active = pathname?.startsWith(`/projects/${p.id}`);
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                active ? "bg-base-raised text-ink" : "text-ink-muted hover:bg-base-raised/60 hover:text-ink"
              }`}
            >
              <HealthDot health={p.health} />
              <span className="truncate">{p.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-base-border text-[11px] text-ink-faint leading-relaxed">
        Data stays in this browser (IndexedDB). Nothing syncs anywhere unless you trigger AI, Jira, or Confluence actions.
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active ? "bg-base-raised text-ink" : "text-ink-muted hover:bg-base-raised/60 hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
