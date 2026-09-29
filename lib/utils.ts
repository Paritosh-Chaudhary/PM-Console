import { v4 as uuidv4 } from "uuid";

export const newId = () => uuidv4();

export const nowIso = () => new Date().toISOString();

export function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function isOverdue(dueDate: string, status: string) {
  if (!dueDate) return false;
  const done = /done|closed|complete|resolved/i.test(status);
  if (done) return false;
  return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");
