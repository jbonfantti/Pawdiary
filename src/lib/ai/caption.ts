import { generateText } from "ai";

// Haiku: captions are latency-sensitive (they run inside the upload action)
// and don't need frontier quality. Routed through the Vercel AI Gateway,
// which authenticates via OIDC on Vercel — no separate API key.
const CAPTION_MODEL = "anthropic/claude-haiku-4.5";

type PetInfo = { name: string; species: string; breed: string | null };

/**
 * Generates a short, warm diary caption for a pet photo. Returns null on any
 * failure — captions are a nice-to-have and must never block an upload.
 */
export async function generatePhotoCaption(
  photo: ArrayBuffer,
  mediaType: string,
  pet: PetInfo,
): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: CAPTION_MODEL,
      system:
        "You write single-sentence captions for a pet diary app. " +
        "Warm, playful, first-person-owner voice, at most 90 characters. " +
        "No hashtags, no quotes around the caption, at most one emoji. " +
        "Never mention anything about image quality or that this is a photo.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Caption this diary photo of ${pet.name}, a ${pet.breed ? `${pet.breed} ` : ""}${pet.species}.`,
            },
            { type: "image", image: photo, mediaType },
          ],
        },
      ],
      maxOutputTokens: 100,
    });

    const caption = text.trim().replace(/^["']|["']$/g, "");
    if (!caption || caption.length > 140) return null;
    return caption;
  } catch {
    return null;
  }
}
