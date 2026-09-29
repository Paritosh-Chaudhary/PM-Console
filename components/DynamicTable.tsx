"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X, Columns3 } from "lucide-react";
import { statusColor } from "./StatusDot";

export type ColumnType = "text" | "textarea" | "status" | "date" | "number";

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  width?: string; // tailwind width class
  suggestions?: string[]; // for "status" type — datalist hints, not a hard enum
}

export interface DynamicTableProps<T extends { id: string; extra: Record<string, string> }> {
  columns: ColumnDef[];
  rows: T[];
  extraFields: string[];
  emptyLabel: string;
  addLabel: string;
  onAddRow: () => void;
  onUpdateRow: (id: string, patch: Partial<T> & Record<string, unknown>) => void;
  onDeleteRow: (id: string) => void;
  onAddExtraField: (label: string) => void;
  onRemoveExtraField: (label: string) => void;
}

export default function DynamicTable<T extends { id: string; extra: Record<string, string> }>({
  columns,
  rows,
  extraFields,
  emptyLabel,
  addLabel,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  onAddExtraField,
  onRemoveExtraField,
}: DynamicTableProps<T>) {
  const [addingField, setAddingField] = useState(false);
  const [fieldName, setFieldName] = useState("");

  const commitField = () => {
    const name = fieldName.trim();
    if (name) onAddExtraField(name);
    setFieldName("");
    setAddingField(false);
  };

  return (
    <div className="rounded-lg border border-base-border bg-base-surface/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-base-border bg-base-raised/60 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2.5 text-[11px] font-mono uppercase tracking-wider text-ink-muted font-medium ${col.width ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
              {extraFields.map((field) => (
                <th key={field} className="px-2 py-2.5 text-[11px] font-mono uppercase tracking-wider text-signal-cyan font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    {field}
                    <button
                      onClick={() => onRemoveExtraField(field)}
                      className="text-ink-faint hover:text-signal-red transition-colors"
                      title={`Remove column "${field}"`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                </th>
              ))}
              <th className="px-2 py-2.5 w-10">
                {addingField ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitField();
                        if (e.key === "Escape") setAddingField(false);
                      }}
                      onBlur={commitField}
                      placeholder="Field name"
                      className="w-28 bg-base-raised border border-signal-cyan/40 rounded px-1.5 py-1 text-xs text-ink outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingField(true)}
                    title="Add a custom column"
                    className="text-ink-faint hover:text-signal-cyan transition-colors p-1"
                  >
                    <Columns3 size={14} />
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + extraFields.length + 1} className="px-4 py-8 text-center text-ink-faint text-sm">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-base-bordersoft hover:bg-base-raised/40 group">
                {columns.map((col) => (
                  <td key={col.key} className="align-top border-r border-base-bordersoft/60 last:border-r-0">
                    <Cell
                      type={col.type}
                      value={String((row as Record<string, unknown>)[col.key] ?? "")}
                      suggestions={col.suggestions}
                      onChange={(v) => onUpdateRow(row.id, { [col.key]: v } as never)}
                    />
                  </td>
                ))}
                {extraFields.map((field) => (
                  <td key={field} className="align-top border-r border-base-bordersoft/60 last:border-r-0">
                    <Cell
                      type="text"
                      value={row.extra?.[field] ?? ""}
                      onChange={(v) =>
                        onUpdateRow(row.id, { extra: { ...row.extra, [field]: v } } as never)
                      }
                    />
                  </td>
                ))}
                <td className="align-top px-1 py-1.5">
                  <button
                    onClick={() => onDeleteRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-signal-red transition-all p-1"
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={onAddRow}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink-muted hover:text-signal-cyan hover:bg-base-raised/40 transition-colors border-t border-base-border"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

function Cell({
  type,
  value,
  suggestions,
  onChange,
}: {
  type: ColumnType;
  value: string;
  suggestions?: string[];
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);

  // Keep in sync with external updates (e.g. AI-filled rows) unless the
  // user is actively typing in this cell.
  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  const commit = () => {
    focused.current = false;
    if (local !== value) onChange(local);
  };

  if (type === "textarea") {
    return (
      <textarea
        rows={2}
        className="cell-textarea"
        value={local}
        onFocus={() => (focused.current = true)}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        placeholder="—"
      />
    );
  }

  if (type === "status") {
    const listId = `list-${suggestions?.join("-").replace(/\s+/g, "")}`;
    return (
      <div className="relative flex items-center">
        <span
          className="status-dot absolute left-2.5 pointer-events-none"
          style={{ backgroundColor: statusColor(local) }}
        />
        <input
          list={listId}
          className="cell-input pl-6"
          value={local}
          onFocus={() => (focused.current = true)}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          placeholder="—"
        />
        <datalist id={listId}>
          {suggestions?.map((s) => (
            <option value={s} key={s} />
          ))}
        </datalist>
      </div>
    );
  }

  return (
    <input
      type={type === "date" ? "date" : type === "number" ? "number" : "text"}
      className="cell-input"
      value={local}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      placeholder="—"
    />
  );
}
