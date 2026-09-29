"use client";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#F0625A",
  warning: "#F2A63D",
  info: "#5B9DF9",
  high: "#F0625A",
  medium: "#F2A63D",
  low: "#4ADE80",
};

export default function Badge({ value, label }: { value: string; label?: string }) {
  const color = SEVERITY_COLOR[value?.toLowerCase()] ?? "#93A1A8";
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide"
      style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}40` }}
    >
      {label ?? value}
    </span>
  );
}
