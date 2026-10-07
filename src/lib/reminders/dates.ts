const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * dueAt is a calendar day stored as midnight UTC. Turn it into that same day
 * in the viewer's local time zone, at the given hour.
 */
export function dueDayLocal(dueAt: Date, hour = 0): Date {
  return new Date(dueAt.getUTCFullYear(), dueAt.getUTCMonth(), dueAt.getUTCDate(), hour);
}

/** Whole days from today (local) until the due day; negative when overdue. */
export function daysUntilDue(dueAt: Date, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueDayLocal(dueAt).getTime() - today.getTime()) / DAY_MS);
}
