"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { dueDayLocal } from "@/lib/reminders/dates";

export type SchedulableReminder = {
  id: string;
  petName: string;
  title: string;
  dueAt: string;
};

const NOTIFY_HOUR = 9;
// iOS keeps at most 64 pending local notifications per app.
const MAX_PENDING = 60;
const KIND = "care_reminder";

// Notification ids must fit a 32-bit int; derive a stable one from the uuid.
function notificationId(reminderId: string): number {
  let hash = 0;
  for (const char of reminderId) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) || 1;
}

/**
 * Mirrors the user's open reminders into on-device notifications inside the
 * native app. Renders nothing and does nothing in a regular browser.
 */
export function ReminderScheduler({ reminders }: { reminders: SchedulableReminder[] }) {
  // Re-sync only when the reminder set actually changes, not on every render.
  const signature = JSON.stringify(reminders);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;

    async function sync() {
      const list: SchedulableReminder[] = JSON.parse(signature);

      let { display } = await LocalNotifications.checkPermissions();
      if (display === "prompt" || display === "prompt-with-rationale") {
        ({ display } = await LocalNotifications.requestPermissions());
      }
      if (display !== "granted" || cancelled) return;

      const { notifications: pending } = await LocalNotifications.getPending();
      const ours = pending.filter((n) => n.extra?.kind === KIND);
      if (ours.length > 0) {
        await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
      }

      const now = Date.now();
      const upcoming = list
        .map((r) => ({ ...r, at: dueDayLocal(new Date(r.dueAt), NOTIFY_HOUR) }))
        .filter((r) => r.at.getTime() > now)
        .slice(0, MAX_PENDING);
      if (upcoming.length === 0 || cancelled) return;

      await LocalNotifications.schedule({
        notifications: upcoming.map((r) => ({
          id: notificationId(r.id),
          title: `${r.petName}: ${r.title}`,
          body: "Due today. Tap to mark it done in PawDiary.",
          schedule: { at: r.at, allowWhileIdle: true },
          extra: { kind: KIND, reminderId: r.id },
        })),
      });
    }

    sync().catch((error) => console.error("Failed to sync care reminders", error));
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return null;
}
