import { generateText } from "ai";

const SUGGESTION_MODEL = "anthropic/claude-haiku-4.5";
// Gemini Flash Image supports editing an input photo, which is what both the
// stylist previews and the avatars need (keep the real pet, change the look).
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

type PetInfo = { name: string; species: string; breed: string | null };

function petDescription(pet: PetInfo): string {
  return `${pet.name}, a ${pet.breed ? `${pet.breed} ` : ""}${pet.species}`;
}

/** Free tier: 3 short accessory/outfit ideas for the pet in the photo. */
export async function suggestOutfits(
  photo: ArrayBuffer,
  mediaType: string,
  pet: PetInfo,
): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: SUGGESTION_MODEL,
      system:
        "You are a playful pet stylist for a US pet diary app. " +
        "Given a pet photo, suggest exactly 3 accessories or outfits that would " +
        "suit this specific pet (consider fur color, size, vibe). " +
        "Format: one suggestion per line, each starting with an emoji, " +
        "under 60 characters per line. No intro or outro text.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Suggest outfits for ${petDescription(pet)}.` },
            { type: "image", image: photo, mediaType },
          ],
        },
      ],
      maxOutputTokens: 200,
    });
    const suggestions = text.trim();
    return suggestions || null;
  } catch {
    return null;
  }
}

/** Premium: photo of the pet edited to wear the requested accessory/outfit. */
export async function generateOutfitImage(
  photo: ArrayBuffer,
  mediaType: string,
  pet: PetInfo,
  accessory: string,
): Promise<Uint8Array | null> {
  return editImage(
    photo,
    mediaType,
    `Edit this photo so that ${petDescription(pet)} is wearing ${accessory}. ` +
      "Keep the pet's real appearance, pose, and background unchanged; only add " +
      "the accessory naturally and realistically.",
  );
}

export const AVATAR_STYLES = {
  cartoon: "a vibrant 3D animated-movie cartoon style",
  watercolor: "a soft watercolor painting style",
  pop_art: "a bold Warhol-inspired pop art style with bright colors",
  pixel_art: "a retro 16-bit pixel art style",
  oil_painting: "a classical oil painting portrait style",
} as const;

export type AvatarStyle = keyof typeof AVATAR_STYLES;

/** Premium: stylized avatar of the pet (cartoon, watercolor, ...). */
export async function generateAvatarImage(
  photo: ArrayBuffer,
  mediaType: string,
  pet: PetInfo,
  style: AvatarStyle,
): Promise<Uint8Array | null> {
  return editImage(
    photo,
    mediaType,
    `Transform this photo of ${petDescription(pet)} into ${AVATAR_STYLES[style]}. ` +
      "Keep the pet clearly recognizable (same markings, colors, and features). " +
      "Make it a charming square portrait suitable as a social media avatar.",
  );
}

/**
 * Premium: the exact photo re-rendered in an artistic style. Unlike avatars
 * (portrait crops), filters keep the full scene and composition.
 */
export async function generateFilteredImage(
  photo: ArrayBuffer,
  mediaType: string,
  style: AvatarStyle,
): Promise<Uint8Array | null> {
  return editImage(
    photo,
    mediaType,
    `Re-render this exact photo in ${AVATAR_STYLES[style]}. ` +
      "Keep the full scene, composition, framing, and every subject exactly as " +
      "they are — only change the artistic rendering style.",
  );
}

async function editImage(
  photo: ArrayBuffer,
  mediaType: string,
  instruction: string,
): Promise<Uint8Array | null> {
  try {
    const result = await generateText({
      model: IMAGE_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image", image: photo, mediaType },
          ],
        },
      ],
    });
    const file = result.files?.find((f) => f.mediaType.startsWith("image/"));
    return file?.uint8Array ?? null;
  } catch {
    return null;
  }
}
