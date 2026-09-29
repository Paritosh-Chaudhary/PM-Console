export type Health = "green" | "amber" | "red";

export interface Project {
  id: string;
  name: string;
  code: string;
  sponsor: string;
  manager: string;
  network: string; // e.g. "APAC Infrastructure Program", "Core Network Rollout"
  status: string; // free text, editable — e.g. Planning / Active / On Hold / Closed
  health: Health;
  currency: string;
  startDate: string;
  endDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** Every record in a dynamic section carries a flexible `extra` bag so
 * the user can add project-specific fields at runtime without a migration. */
export interface WithExtra {
  extra: Record<string, string>;
}

export interface ScopeItem extends WithExtra {
  id: string;
  projectId: string;
  category: string; // Objective / Deliverable / Exclusion / Milestone / custom
  title: string;
  description: string;
  status: string;
  dueDate: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RaidItem extends WithExtra {
  id: string;
  projectId: string;
  category: "Risk" | "Assumption" | "Issue" | "Dependency" | string;
  title: string;
  description: string;
  owner: string;
  impact: string; // Low / Medium / High / Critical (editable)
  probability: string; // Low / Medium / High (editable)
  status: string; // Open / Mitigating / Closed / Realized (editable)
  dateRaised: string;
  targetDate: string;
  mitigation: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetLine extends WithExtra {
  id: string;
  projectId: string;
  category: string; // Labour / Hardware / Licensing / Vendor / custom
  description: string;
  plannedAmount: number;
  actualAmount: number;
  period: string; // e.g. "Q1 2026"
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem extends WithExtra {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string; // To Do / In Progress / Blocked / Done (editable)
  priority: string; // Low / Medium / High / Critical (editable)
  assignee: string;
  startDate: string;
  dueDate: string;
  jiraKey: string; // optional link to a synced Jira issue
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowupItem extends WithExtra {
  id: string;
  projectId: string;
  taskId: string; // optional — links a follow-up back to a task
  title: string;
  notes: string;
  owner: string;
  status: string; // Pending / In Progress / Done / Overdue (editable)
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogItem extends WithExtra {
  id: string;
  projectId: string;
  type: string; // Decision / Change / Activity / Meeting Note / AI Report (editable)
  title: string;
  notes: string;
  author: string;
  date: string;
  createdAt: string;
}

export type SectionKey =
  | "scope"
  | "raid"
  | "budget"
  | "tasks"
  | "followups"
  | "logs";

export interface BoardConfig {
  id: string; // `${projectId}__${section}`
  projectId: string;
  section: SectionKey;
  extraFields: string[];
}

export type AiActionType = "raid-suggest" | "budget-insight" | "report" | "health-check";

/** One record per AI action taken, used to compute the "time saved" metric
 * shown on the dashboard and project overview. */
export interface AiActionLog {
  id: string;
  projectId: string;
  type: AiActionType;
  minutesSaved: number;
  itemsAccepted: number;
  meta: string;
  createdAt: string;
}

/** A single structured, actionable RAID suggestion returned by the AI —
 * rendered as a card with an "Add to RAID Log" button rather than prose. */
export interface RaidSuggestionItem {
  category: string;
  title: string;
  description: string;
  impact: string;
  probability: string;
  mitigation: string;
}

/** A structured budget insight, optionally carrying a one-click follow-up. */
export interface BudgetInsightItem {
  severity: "info" | "warning" | "critical";
  category: string;
  title: string;
  detail: string;
  suggestedFollowup?: { title: string; notes: string } | null;
}

/** A cross-section flag from the AI Health Check — can be converted
 * directly into a RAID entry or a follow-up with one click. */
export interface HealthCheckItem {
  section: "raid" | "followups";
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  raid?: Partial<RaidSuggestionItem>;
  followup?: { title: string; notes: string };
}

export interface JiraSettings {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface ConfluenceSettings {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
}

export interface AppSettings {
  jira: JiraSettings;
  confluence: ConfluenceSettings;
}

export const emptySettings: AppSettings = {
  jira: { baseUrl: "", email: "", apiToken: "", projectKey: "" },
  confluence: { baseUrl: "", email: "", apiToken: "", spaceKey: "" },
};
