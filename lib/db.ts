import Dexie, { type Table } from "dexie";
import type {
  Project,
  ScopeItem,
  RaidItem,
  BudgetLine,
  TaskItem,
  FollowupItem,
  LogItem,
  BoardConfig,
  AiActionLog,
} from "./types";

/**
 * All project data lives in IndexedDB, in the browser, on this machine only.
 * Nothing is sent anywhere unless you explicitly trigger an AI request,
 * a Jira sync, or a Confluence publish — each of which is a deliberate,
 * user-initiated action from Settings / the Reports tab.
 */
export class ICTPMDatabase extends Dexie {
  projects!: Table<Project, string>;
  scopeItems!: Table<ScopeItem, string>;
  raidItems!: Table<RaidItem, string>;
  budgetLines!: Table<BudgetLine, string>;
  tasks!: Table<TaskItem, string>;
  followups!: Table<FollowupItem, string>;
  logs!: Table<LogItem, string>;
  boardConfigs!: Table<BoardConfig, string>;
  aiActions!: Table<AiActionLog, string>;

  constructor() {
    super("ict-pm-suite");
    this.version(1).stores({
      projects: "id, name, status, health, updatedAt",
      scopeItems: "id, projectId, category, order",
      raidItems: "id, projectId, category, status, impact",
      budgetLines: "id, projectId, category, period",
      tasks: "id, projectId, status, priority, dueDate",
      followups: "id, projectId, taskId, status, dueDate",
      logs: "id, projectId, type, date",
      boardConfigs: "id, projectId, section",
    });
    this.version(2).stores({
      aiActions: "id, projectId, type, createdAt",
    });
  }
}

export const db = new ICTPMDatabase();

export function boardConfigId(projectId: string, section: string) {
  return `${projectId}__${section}`;
}
