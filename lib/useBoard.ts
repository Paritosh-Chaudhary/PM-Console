"use client";

import { useLiveQuery } from "dexie-react-hooks";
import type { Table } from "dexie";
import { db, boardConfigId } from "./db";
import type { SectionKey } from "./types";
import { newId, nowIso } from "./utils";

interface BaseRow {
  id: string;
  projectId: string;
  extra: Record<string, string>;
  createdAt: string;
}

/**
 * Generic CRUD + "custom column" hook shared by every dynamic section
 * (Scope, RAID, Budget, Tasks, Follow-ups, Logs). Each section passes its
 * Dexie table and a factory for a blank row; everything else — add,
 * inline edit, delete, and adding/removing user-defined columns — is
 * identical across sections.
 */
export function useBoard<T extends BaseRow>(
  table: Table<T, string>,
  projectId: string,
  section: SectionKey,
  makeBlank: (id: string, projectId: string, now: string) => T
) {
  const rows = useLiveQuery(
    () => table.where("projectId").equals(projectId).sortBy("createdAt"),
    [projectId]
  );

  const cfgId = boardConfigId(projectId, section);
  const config = useLiveQuery(() => db.boardConfigs.get(cfgId), [cfgId]);

  const addRow = async () => {
    const now = nowIso();
    const row = makeBlank(newId(), projectId, now);
    await table.add(row);
  };

  const updateRow = async (id: string, patch: Partial<T>) => {
    await table.update(id, { ...patch, updatedAt: nowIso() } as never);
  };

  const deleteRow = async (id: string) => {
    await table.delete(id);
  };

  const addExtraField = async (label: string) => {
    const existing = config?.extraFields ?? [];
    if (existing.includes(label)) return;
    await db.boardConfigs.put({
      id: cfgId,
      projectId,
      section,
      extraFields: [...existing, label],
    });
  };

  const removeExtraField = async (label: string) => {
    const existing = config?.extraFields ?? [];
    await db.boardConfigs.put({
      id: cfgId,
      projectId,
      section,
      extraFields: existing.filter((f) => f !== label),
    });
  };

  return {
    rows: rows ?? [],
    loading: rows === undefined,
    extraFields: config?.extraFields ?? [],
    addRow,
    updateRow,
    deleteRow,
    addExtraField,
    removeExtraField,
  };
}
