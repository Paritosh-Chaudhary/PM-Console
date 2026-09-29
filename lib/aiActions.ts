"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { newId, nowIso } from "./utils";
import type { AiActionType } from "./types";

/** Conservative, defensible estimates of manual effort replaced by each AI
 * action — used only to compute a directional "time saved" metric, not
 * billed anywhere. Tune these to match your own experience. */
export const AI_ACTION_MINUTES: Record<AiActionType, number> = {
  "raid-suggest": 15,
  "budget-insight": 20,
  report: 45,
  "health-check": 25,
};

export const AI_ACTION_LABELS: Record<AiActionType, string> = {
  "raid-suggest": "RAID risk suggestions",
  "budget-insight": "Budget insight",
  report: "Status report",
  "health-check": "AI health check",
};

export async function logAiAction(projectId: string, type: AiActionType, meta = "") {
  await db.aiActions.add({
    id: newId(),
    projectId,
    type,
    minutesSaved: AI_ACTION_MINUTES[type],
    itemsAccepted: 0,
    meta,
    createdAt: nowIso(),
  });
}

/** Increments the "accepted" counter on the most recent action of a type
 * for a project — called when a suggestion card is actually turned into a
 * real RAID/follow-up row, so the metric reflects accepted value, not just
 * requests made. */
export async function markAiActionAccepted(projectId: string, type: AiActionType) {
  const latest = await db.aiActions
    .where("projectId")
    .equals(projectId)
    .and((a) => a.type === type)
    .reverse()
    .sortBy("createdAt");
  const mostRecent = latest[0];
  if (mostRecent) {
    await db.aiActions.update(mostRecent.id, { itemsAccepted: mostRecent.itemsAccepted + 1 });
  }
}

export function useAiStats(projectId?: string) {
  const actions = useLiveQuery(
    () => (projectId ? db.aiActions.where("projectId").equals(projectId).toArray() : db.aiActions.toArray()),
    [projectId]
  );
  const list = actions ?? [];
  const totalActions = list.length;
  const totalMinutes = list.reduce((sum, a) => sum + (a.minutesSaved || 0), 0);
  const totalAccepted = list.reduce((sum, a) => sum + (a.itemsAccepted || 0), 0);
  return {
    loading: actions === undefined,
    totalActions,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    totalAccepted,
  };
}
