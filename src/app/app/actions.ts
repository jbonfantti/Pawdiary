"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pets, timelineEntries } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { uploadDiaryMedia } from "@/lib/storage/blob";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export async function addPet(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const breed = String(formData.get("breed") ?? "").trim();
  const birthDateRaw = String(formData.get("birthDate") ?? "");

  const [pet] = await db
    .insert(pets)
    .values({
      userId: user.id,
      name,
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
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, user.id)))
    .limit(1);
  if (!pet) return;

  const blob = await uploadDiaryMedia(`pets/${pet.id}/photos/${photo.name}`, photo);

  const caption = String(formData.get("caption") ?? "").trim();

  await db.insert(timelineEntries).values({
    petId: pet.id,
    type: "photo",
    mediaUrl: blob.url,
    caption: caption || null,
    occurredAt: new Date(),
  });

  revalidatePath(`/app/pets/${pet.id}`);
}
