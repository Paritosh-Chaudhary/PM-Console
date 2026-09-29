"use client";

const POSITIVE = /done|closed|complete|resolved|mitigated|active|low/i;
const WARNING = /progress|pending|medium|amber|hold|review/i;
const NEGATIVE = /blocked|overdue|critical|high|red|open|realized/i;

export function statusColor(value: string): string {
  if (!value) return "#5E6B72";
  if (NEGATIVE.test(value)) return "#F0625A";
  if (WARNING.test(value)) return "#F2A63D";
  if (POSITIVE.test(value)) return "#4ADE80";
  return "#5B9DF9";
}

export default function StatusDot({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="status-dot" style={{ backgroundColor: statusColor(value) }} />
      <span className="text-ink text-sm">{value || "—"}</span>
    </span>
  );
}

export function HealthDot({ health }: { health: "green" | "amber" | "red" }) {
  const color = health === "green" ? "#4ADE80" : health === "amber" ? "#F2A63D" : "#F0625A";
  return <span className="status-dot" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />;
}
