import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { careReminders, pets } from "@/lib/db/schema";

/** All of a user's open reminders across every pet, soonest first. */
export async function getOpenRemindersForUser(userId: string) {
  return db
    .select({
      id: careReminders.id,
      petId: careReminders.petId,
      petName: pets.name,
      type: careReminders.type,
      title: careReminders.title,
      dueAt: careReminders.dueAt,
      repeatDays: careReminders.repeatDays,
      notes: careReminders.notes,
    })
    .from(careReminders)
    .innerJoin(pets, eq(careReminders.petId, pets.id))
    .where(and(eq(pets.userId, userId), isNull(careReminders.completedAt)))
    .orderBy(asc(careReminders.dueAt));
}

export type OpenReminder = Awaited<ReturnType<typeof getOpenRemindersForUser>>[number];
