"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  careReminders,
  careReminderTypeValues,
  healthRecords,
  healthRecordTypeValues,
  pets,
  petSpeciesValues,
  timelineEntries,
} from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { uploadDiaryMedia } from "@/lib/storage/blob";
import { generatePhotoCaption } from "@/lib/ai/caption";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export async function addPet(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const breed = String(formData.get("breed") ?? "").trim();
  const birthDateRaw = String(formData.get("birthDate") ?? "");

  const speciesRaw = String(formData.get("species") ?? "");
  const species = (petSpeciesValues as readonly string[]).includes(speciesRaw)
    ? (speciesRaw as (typeof petSpeciesValues)[number])
    : "other";

  const [pet] = await db
    .insert(pets)
    .values({
      userId: user.id,
      name,
      species,
      breed: breed || null,
      birthDate: birthDateRaw ? new Date(birthDateRaw) : null,
    })
    .returning();

  revalidatePath("/app");
  redirect(`/app/pets/${pet.id}`);
}

export async function addPhotoEntry(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const petId = String(formData.get("petId") ?? "");
  const photo = formData.get("photo");
  if (!petId || !(photo instanceof File) || photo.size === 0) return;
  if (photo.size > MAX_PHOTO_BYTES) return;
  if (!photo.type.startsWith("image/")) return;

  // Ownership check: never trust the petId from the form alone.
  const [pet] = await db
    .select({ id: pets.id, name: pets.name, species: pets.species, breed: pets.breed })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, user.id)))
    .limit(1);
  if (!pet) return;

  const blob = await uploadDiaryMedia(`pets/${pet.id}/photos/${photo.name}`, photo);

  let caption = String(formData.get("caption") ?? "").trim();
  let aiGenerated = false;

  if (!caption) {
    const generated = await generatePhotoCaption(
      await photo.arrayBuffer(),
      photo.type,
      pet,
    );
    if (generated) {
      caption = generated;
      aiGenerated = true;
    }
  }

  await db.insert(timelineEntries).values({
    petId: pet.id,
    type: "photo",
    mediaUrl: blob.url,
    caption: caption || null,
    aiGenerated,
    occurredAt: new Date(),
  });

  revalidatePath(`/app/pets/${pet.id}`);
}

const LB_PER_KG = 2.20462;

export async function addHealthRecord(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const petId = String(formData.get("petId") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  if (!petId || !(healthRecordTypeValues as readonly string[]).includes(typeRaw)) {
    return;
  }
  const type = typeRaw as (typeof healthRecordTypeValues)[number];

  const [pet] = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, user.id)))
    .limit(1);
  if (!pet) return;

  // Weight is entered in lbs (US-only product) but stored in kg.
  let weightKg: string | null = null;
  if (type === "weight") {
    const weightLb = Number(formData.get("weightLb"));
    if (!Number.isFinite(weightLb) || weightLb <= 0 || weightLb > 500) return;
    weightKg = (weightLb / LB_PER_KG).toFixed(2);
  }

  const notes = String(formData.get("notes") ?? "").trim();
  const recordedAtRaw = String(formData.get("recordedAt") ?? "");

  await db.insert(healthRecords).values({
    petId: pet.id,
    type,
    weightKg,
    notes: notes || null,
    recordedAt: recordedAtRaw ? new Date(recordedAtRaw) : new Date(),
  });

  revalidatePath(`/app/pets/${pet.id}`);
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Care types that leave a matching entry in the health book when done.
const REMINDER_TO_RECORD: Partial<
  Record<(typeof careReminderTypeValues)[number], (typeof healthRecordTypeValues)[number]>
> = {
  vaccine: "vaccine",
  dewormer: "dewormer",
  vet_visit: "vet_visit",
};

async function findOwnedReminder(reminderId: string, userId: string) {
  const [row] = await db
    .select({ reminder: careReminders, petId: pets.id })
    .from(careReminders)
    .innerJoin(pets, eq(careReminders.petId, pets.id))
    .where(and(eq(careReminders.id, reminderId), eq(pets.userId, userId)))
    .limit(1);
  return row;
}

export async function addCareReminder(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const petId = String(formData.get("petId") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  if (!petId || !(careReminderTypeValues as readonly string[]).includes(typeRaw)) {
    return;
  }
  const type = typeRaw as (typeof careReminderTypeValues)[number];

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const dueRaw = String(formData.get("dueAt") ?? "");
  // A bare yyyy-mm-dd parses as midnight UTC, which is how dueAt is stored.
  const dueAt = new Date(dueRaw);
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(dueRaw) || Number.isNaN(dueAt.getTime())) {
    return;
  }

  const repeatDays = Number(formData.get("repeatDays") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 280);

  const [pet] = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, user.id)))
    .limit(1);
  if (!pet) return;

  await db.insert(careReminders).values({
    petId: pet.id,
    type,
    title,
    dueAt,
    repeatDays:
      Number.isInteger(repeatDays) && repeatDays > 0 && repeatDays <= 3650 ? repeatDays : null,
    notes: notes || null,
  });

  revalidatePath("/app");
  revalidatePath(`/app/pets/${pet.id}`);
}

export async function completeCareReminder(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const row = await findOwnedReminder(String(formData.get("reminderId") ?? ""), user.id);
  if (!row || row.reminder.completedAt) return;
  const { reminder } = row;

  const now = new Date();
  const recordType = REMINDER_TO_RECORD[reminder.type];
  if (recordType) {
    await db.insert(healthRecords).values({
      petId: row.petId,
      type: recordType,
      notes: reminder.title,
      recordedAt: now,
    });
  }

  if (reminder.repeatDays) {
    // Next dose counts from when it was actually given, not the old due date.
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    await db
      .update(careReminders)
      .set({ dueAt: new Date(today + reminder.repeatDays * DAY_MS) })
      .where(eq(careReminders.id, reminder.id));
  } else {
    await db
      .update(careReminders)
      .set({ completedAt: now })
      .where(eq(careReminders.id, reminder.id));
  }

  // Reminders can be completed from the dashboard's "Coming up" list too.
  revalidatePath("/app");
  revalidatePath(`/app/pets/${row.petId}`);
}

export async function deleteCareReminder(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const row = await findOwnedReminder(String(formData.get("reminderId") ?? ""), user.id);
  if (!row) return;

  await db.delete(careReminders).where(eq(careReminders.id, row.reminder.id));
  revalidatePath("/app");
  revalidatePath(`/app/pets/${row.petId}`);
}
