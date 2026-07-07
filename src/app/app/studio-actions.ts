"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db/client";
import { pets, timelineEntries } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { hasPremium } from "@/lib/premium";
import { uploadDiaryMedia } from "@/lib/storage/blob";
import {
  AVATAR_STYLES,
  generateAvatarImage,
  generateFilteredImage,
  generateOutfitImage,
  suggestOutfits,
  type AvatarStyle,
} from "@/lib/ai/studio";

type StudioResult =
  | { ok: true; suggestions?: string }
  | { ok: false; error: "unauthorized" | "premium_required" | "no_photo" | "failed" };

async function loadPetAndLatestPhoto(petId: string) {
  const user = await getOrCreateUser();
  if (!user) return null;

  const [pet] = await db
    .select({
      id: pets.id,
      name: pets.name,
      species: pets.species,
      breed: pets.breed,
    })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, user.id)))
    .limit(1);
  if (!pet) return null;

  const [entry] = await db
    .select({ mediaUrl: timelineEntries.mediaUrl })
    .from(timelineEntries)
    .where(
      and(
        eq(timelineEntries.petId, pet.id),
        eq(timelineEntries.type, "photo"),
        eq(timelineEntries.aiGenerated, false),
        isNotNull(timelineEntries.mediaUrl),
      ),
    )
    .orderBy(desc(timelineEntries.occurredAt))
    .limit(1);

  return { user, pet, mediaUrl: entry?.mediaUrl ?? null };
}

async function fetchPhoto(mediaUrl: string) {
  const result = await get(mediaUrl, {
    access: "private",
    storeId: process.env.BLOB_DIARY_STORE_ID,
  });
  if (!result || result.statusCode !== 200) return null;
  return {
    bytes: await new Response(result.stream).arrayBuffer(),
    mediaType: result.blob.contentType ?? "image/jpeg",
  };
}

export async function getOutfitSuggestions(petId: string): Promise<StudioResult> {
  const ctx = await loadPetAndLatestPhoto(petId);
  if (!ctx) return { ok: false, error: "unauthorized" };
  if (!ctx.mediaUrl) return { ok: false, error: "no_photo" };

  const photo = await fetchPhoto(ctx.mediaUrl);
  if (!photo) return { ok: false, error: "no_photo" };

  const suggestions = await suggestOutfits(photo.bytes, photo.mediaType, ctx.pet);
  if (!suggestions) return { ok: false, error: "failed" };
  return { ok: true, suggestions };
}

export async function generateStylistPreview(
  petId: string,
  accessory: string,
): Promise<StudioResult> {
  const cleaned = accessory.trim().slice(0, 120);
  if (!cleaned) return { ok: false, error: "failed" };
  return generateToTimeline(petId, (photo, mediaType, pet) =>
    generateOutfitImage(photo, mediaType, pet, cleaned).then((img) => ({
      image: img,
      caption: `AI Stylist: ${cleaned} ✨`,
    })),
  );
}

export async function generateAvatar(
  petId: string,
  style: string,
): Promise<StudioResult> {
  if (!(style in AVATAR_STYLES)) return { ok: false, error: "failed" };
  const avatarStyle = style as AvatarStyle;
  return generateToTimeline(petId, (photo, mediaType, pet) =>
    generateAvatarImage(photo, mediaType, pet, avatarStyle).then((img) => ({
      image: img,
      caption: `AI Avatar — ${avatarStyle.replace("_", " ")} ✨`,
    })),
  );
}

async function generateToTimeline(
  petId: string,
  generate: (
    photo: ArrayBuffer,
    mediaType: string,
    pet: { name: string; species: string; breed: string | null },
  ) => Promise<{ image: Uint8Array | null; caption: string }>,
): Promise<StudioResult> {
  const ctx = await loadPetAndLatestPhoto(petId);
  if (!ctx) return { ok: false, error: "unauthorized" };

  // Image generation is the expensive premium feature; suggestions stay free.
  if (!(await hasPremium(ctx.user.clerkId))) {
    return { ok: false, error: "premium_required" };
  }
  if (!ctx.mediaUrl) return { ok: false, error: "no_photo" };

  const photo = await fetchPhoto(ctx.mediaUrl);
  if (!photo) return { ok: false, error: "no_photo" };

  const { image, caption } = await generate(photo.bytes, photo.mediaType, ctx.pet);
  if (!image) return { ok: false, error: "failed" };

  const blob = await uploadDiaryMedia(
    `pets/${ctx.pet.id}/ai/generated.png`,
    Buffer.from(image),
  );

  await db.insert(timelineEntries).values({
    petId: ctx.pet.id,
    type: "photo",
    mediaUrl: blob.url,
    caption,
    aiGenerated: true,
    occurredAt: new Date(),
  });

  revalidatePath(`/app/pets/${ctx.pet.id}`);
  return { ok: true };
}

/**
 * Applies an artistic filter to one specific timeline photo (unlike the
 * studio flows above, which always use the latest photo).
 */
export async function applyFilterToEntry(
  entryId: string,
  style: string,
): Promise<StudioResult> {
  if (!(style in AVATAR_STYLES)) return { ok: false, error: "failed" };
  const filterStyle = style as AvatarStyle;

  const user = await getOrCreateUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!(await hasPremium(user.clerkId))) {
    return { ok: false, error: "premium_required" };
  }

  const [row] = await db
    .select({ petId: timelineEntries.petId, mediaUrl: timelineEntries.mediaUrl })
    .from(timelineEntries)
    .innerJoin(pets, eq(timelineEntries.petId, pets.id))
    .where(and(eq(timelineEntries.id, entryId), eq(pets.userId, user.id)))
    .limit(1);
  if (!row?.mediaUrl) return { ok: false, error: "no_photo" };

  const photo = await fetchPhoto(row.mediaUrl);
  if (!photo) return { ok: false, error: "no_photo" };

  const image = await generateFilteredImage(photo.bytes, photo.mediaType, filterStyle);
  if (!image) return { ok: false, error: "failed" };

  const blob = await uploadDiaryMedia(
    `pets/${row.petId}/ai/filtered.png`,
    Buffer.from(image),
  );

  await db.insert(timelineEntries).values({
    petId: row.petId,
    type: "photo",
    mediaUrl: blob.url,
    caption: `AI Filter — ${filterStyle.replace("_", " ")} ✨`,
    aiGenerated: true,
    occurredAt: new Date(),
  });

  revalidatePath(`/app/pets/${row.petId}`);
  return { ok: true };
}
