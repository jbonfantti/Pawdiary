import type { OpenReminder } from "@/lib/reminders/queries";
import { daysUntilDue } from "@/lib/reminders/dates";
import { REMINDER_TYPE_LABELS } from "@/components/AddCareReminderForm";

function dueLabel(days: number): { text: string; tone: string } {
  if (days < 0) {
    const late = -days;
    return {
      text: `Overdue by ${late} day${late === 1 ? "" : "s"}`,
      tone: "bg-red-50 text-red-700",
    };
  }
  if (days === 0) return { text: "Due today", tone: "bg-amber-50 text-amber-800" };
  if (days <= 7) {
    return {
      text: `Due in ${days} day${days === 1 ? "" : "s"}`,
      tone: "bg-amber-50 text-amber-800",
    };
  }
  return { text: `Due in ${days} days`, tone: "bg-zinc-100 text-zinc-600" };
}

export function CareReminderList({
  reminders,
  showPetName = false,
  completeAction,
  deleteAction,
}: {
  reminders: OpenReminder[];
  showPetName?: boolean;
  completeAction: (formData: FormData) => void;
  deleteAction?: (formData: FormData) => void;
}) {
  if (reminders.length === 0) return null;

  return (
    <ul className="mt-4 grid gap-2">
      {reminders.map((reminder) => {
        const due = dueLabel(daysUntilDue(reminder.dueAt));
        return (
          <li
            key={reminder.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm"
          >
            <span className="grid gap-0.5">
              <span className="font-medium">
                {showPetName && `${reminder.petName} · `}
                {reminder.title}
              </span>
              <span className="text-xs text-zinc-500">
                {REMINDER_TYPE_LABELS[reminder.type]}
                {reminder.repeatDays ? ` · repeats every ${reminder.repeatDays} days` : ""}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${due.tone}`}>
                {due.text}
              </span>
              <form action={completeAction}>
                <input type="hidden" name="reminderId" value={reminder.id} />
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  Done
                </button>
              </form>
              {deleteAction && (
                <form action={deleteAction}>
                  <input type="hidden" name="reminderId" value={reminder.id} />
                  <button
                    type="submit"
                    aria-label={`Delete reminder ${reminder.title}`}
                    className="rounded-full px-2 py-1 text-xs text-zinc-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </form>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
