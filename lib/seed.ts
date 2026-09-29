import { db } from "./db";
import { newId, nowIso } from "./utils";

/** Populates one realistic ICT network-rollout project so the console is
 * screenshot-ready immediately after cloning. Safe to call multiple times —
 * each call creates a fresh, separately-named project. */
export async function seedSampleProject() {
  const projectId = newId();
  const now = nowIso();
  const today = new Date();
  const iso = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };

  await db.projects.add({
    id: projectId,
    name: "Regional Core Network Modernization",
    code: "NET-2026-07",
    sponsor: "VP Infrastructure",
    manager: "You",
    network: "APAC Infrastructure Program",
    status: "Active",
    health: "amber",
    currency: "USD",
    startDate: iso(-40),
    endDate: iso(70),
    description:
      "Replace end-of-life core switches across 6 regional sites, migrate to a segmented SD-WAN architecture, and decommission the legacy MPLS backbone.",
    createdAt: now,
    updatedAt: now,
  });

  const scope = [
    ["Objective", "Zero unplanned downtime during cutover", "Success criterion for the whole program.", "In progress", iso(70)],
    ["Deliverable", "SD-WAN deployed to all 6 regional sites", "Core deliverable — hardware + config + validation.", "In progress", iso(45)],
    ["Deliverable", "Legacy MPLS backbone decommissioned", "Final step once all sites are validated on SD-WAN.", "Not started", iso(65)],
    ["Milestone", "Pilot site (Singapore) cutover complete", "Proof point before wider rollout.", "Delivered", iso(-10)],
    ["Exclusion", "Branch office Wi-Fi refresh", "Explicitly out of scope — separate workstream.", "Not started", ""],
  ] as const;
  for (const [category, title, description, status, dueDate] of scope) {
    await db.scopeItems.add({
      id: newId(),
      projectId,
      category,
      title,
      description,
      status,
      dueDate,
      order: Date.now() + Math.random(),
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  const raid = [
    ["Risk", "Vendor hardware lead time slips past cutover window", "Core switch backorders could delay 3 of 6 sites.", "You", "High", "Medium", "Open", iso(-20), iso(20), "Expedite order, hold weekly vendor call, pre-stage spares."],
    ["Issue", "Change freeze conflicts with Tokyo site cutover", "Finance year-end freeze overlaps planned cutover date.", "You", "Medium", "High", "Open", iso(-5), iso(30), "Negotiating an exception window with change board."],
    ["Assumption", "All sites have redundant WAN circuits available", "Design assumes dual-homed WAN at every site.", "Network Architect", "Medium", "Low", "Open", iso(-30), "", "Validate per-site during design review."],
    ["Dependency", "Security review sign-off on SD-WAN policy set", "Cutover blocked until InfoSec approves segmentation policy.", "InfoSec Lead", "High", "Medium", "Mitigating", iso(-15), iso(10), "Submitted policy doc; review scheduled."],
  ] as const;
  for (const [category, title, description, owner, impact, probability, status, dateRaised, targetDate, mitigation] of raid) {
    await db.raidItems.add({
      id: newId(),
      projectId,
      category,
      title,
      description,
      owner,
      impact,
      probability,
      status,
      dateRaised,
      targetDate,
      mitigation,
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  const budget = [
    ["Hardware", "Core switches (6 sites)", "Q1 2026", 420000, 260000, "Committed"],
    ["Vendor / SI", "Systems integrator — design & cutover support", "Q1 2026", 150000, 95000, "Invoiced"],
    ["Licensing", "SD-WAN controller licenses (3yr)", "Q1 2026", 90000, 90000, "Paid"],
    ["Labour", "Internal network engineering time", "Q1-Q2 2026", 60000, 38000, "Forecast"],
    ["Contingency", "Reserve for cutover overruns", "Q1-Q2 2026", 40000, 4000, "Forecast"],
  ] as const;
  for (const [category, description, period, plannedAmount, actualAmount, status] of budget) {
    await db.budgetLines.add({
      id: newId(),
      projectId,
      category,
      description,
      plannedAmount,
      actualAmount,
      period,
      status,
      notes: "",
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  const tasks = [
    ["Finalize SD-WAN segmentation policy", "Draft policy for InfoSec review.", "Done", "High", "You", iso(-25), iso(-8)],
    ["Stage core switches for Osaka site", "Rack, cable and pre-configure before cutover window.", "In Progress", "High", "Network Team", iso(-5), iso(12)],
    ["Negotiate change-freeze exception (Tokyo)", "Get sign-off from change advisory board.", "Blocked", "Critical", "You", iso(-3), iso(9)],
    ["Run cutover rehearsal — Singapore", "Dry run before wider rollout playbook is finalized.", "Done", "Medium", "Network Team", iso(-14), iso(-11)],
    ["Draft decommission plan for legacy MPLS", "Sequence and rollback plan for backbone teardown.", "To Do", "Medium", "You", "", iso(50)],
  ] as const;
  for (const [title, description, status, priority, assignee, startDate, dueDate] of tasks) {
    await db.tasks.add({
      id: newId(),
      projectId,
      title,
      description,
      status,
      priority,
      assignee,
      startDate,
      dueDate,
      jiraKey: "",
      tags: "",
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  const followups = [
    ["Chase InfoSec on policy sign-off", "No response since last Tuesday's submission.", "You", "Pending", iso(2)],
    ["Confirm vendor ship date for Osaka hardware", "Vendor promised an update by end of week.", "You", "Pending", iso(-1)],
  ] as const;
  for (const [title, notes, owner, status, dueDate] of followups) {
    await db.followups.add({
      id: newId(),
      projectId,
      taskId: "",
      title,
      notes,
      owner,
      status,
      dueDate,
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  const logs = [
    ["Decision", "Approved phased rollout order: SG -> Tokyo -> Osaka -> rest", "Agreed with sponsor to de-risk by starting with the smallest site.", "You", iso(-38)],
    ["Change", "Cutover window moved from Feb to Mar for Tokyo", "Due to change-freeze conflict.", "You", iso(-4)],
    ["Meeting Note", "Weekly vendor sync — hardware lead times", "Vendor confirmed partial shipment; remaining units in 3 weeks.", "You", iso(-2)],
  ] as const;
  for (const [type, title, notes, author, date] of logs) {
    await db.logs.add({
      id: newId(),
      projectId,
      type,
      title,
      notes,
      author,
      date,
      extra: {},
      createdAt: now,
    });
  }

  return projectId;
}
